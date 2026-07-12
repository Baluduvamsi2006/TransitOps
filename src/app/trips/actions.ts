"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";
import { TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";
import { getServerSession } from "../../lib/jwt";
import { canManagePath } from "../../lib/rbac";

const TRIPS_PATH = "/trips";

function buildRedirectPath(targetPath: string, messageKey: string, message: string) {
  const url = new URL(targetPath, "http://local.test");
  url.searchParams.set(messageKey, message);
  return `${url.pathname}${url.search}${url.hash}`;
}

function redirectTo(path: string): never {
  redirect(path as never);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  return value ? Number(value) : 0;
}

export async function createTrip(formData: FormData) {
  const session = await getServerSession();
  if (!session || !canManagePath(session.role, "/trips")) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Unauthorized."));
  }

  const source = readString(formData, "source");
  const destination = readString(formData, "destination");
  const cargoWeight = readNumber(formData, "cargoWeight");
  const plannedDistance = readNumber(formData, "plannedDistance");
  const vehicleId = readString(formData, "vehicleId");
  const driverId = readString(formData, "driverId");

  if (!source || !destination || !cargoWeight || !plannedDistance || !vehicleId || !driverId) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "All fields are required."));
  }

  // Get vehicle and driver to validate
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  const driver = await prisma.driver.findUnique({ where: { id: driverId } });

  if (!vehicle) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Selected vehicle not found."));
  }
  if (!driver) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Selected driver not found."));
  }

  // Verify cargo capacity
  if (cargoWeight > vehicle.maxLoadCapacity) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", `Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity} kg).`));
  }

  // Verify driver eligibility
  if (driver.status === "SUSPENDED") {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Selected driver is suspended."));
  }
  if (driver.licenseExpiryDate.getTime() < Date.now()) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Selected driver has an expired license."));
  }

  try {
    await prisma.trip.create({
      data: {
        source,
        destination,
        cargoWeight,
        plannedDistance,
        status: TripStatus.DRAFT,
        vehicleId,
        driverId
      }
    });
  } catch (error) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Failed to draft the trip."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(TRIPS_PATH, "message", "Trip drafted successfully."));
}

export async function dispatchTrip(formData: FormData) {
  const session = await getServerSession();
  if (!session || !canManagePath(session.role, "/trips")) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Unauthorized."));
  }

  const id = readString(formData, "id");

  if (!id) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Missing trip ID."));
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true, driver: true }
  });

  if (!trip) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Trip not found."));
  }

  // Validate business rules for dispatch
  if (trip.vehicle.status !== "AVAILABLE") {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", `Vehicle is not available (Status: ${trip.vehicle.status}).`));
  }
  if (trip.driver.status !== "AVAILABLE") {
    const msg = trip.driver.status === "SUSPENDED" ? "Driver is suspended." : `Driver is not available (Status: ${trip.driver.status}).`;
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", msg));
  }
  if (trip.driver.licenseExpiryDate.getTime() < Date.now()) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Driver's license is expired."));
  }
  if (trip.cargoWeight > trip.vehicle.maxLoadCapacity) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Cargo weight exceeds vehicle capacity."));
  }

  try {
    await prisma.$transaction([
      prisma.trip.update({
        where: { id },
        data: { status: TripStatus.DISPATCHED, dispatchedAt: new Date() }
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.ON_TRIP }
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.ON_TRIP }
      })
    ]);
  } catch (error) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Failed to dispatch the trip."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(TRIPS_PATH, "message", "Trip dispatched successfully."));
}

export async function completeTrip(formData: FormData) {
  const session = await getServerSession();
  if (!session || !canManagePath(session.role, "/trips")) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Unauthorized."));
  }

  const id = readString(formData, "id");
  const finalOdometer = readNumber(formData, "finalOdometer");
  const fuelLiters = readNumber(formData, "fuelLiters");
  const fuelCost = readNumber(formData, "fuelCost");

  if (!id) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Missing trip ID."));
  }

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: true }
  });

  if (!trip) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Trip not found."));
  }

  if (trip.status !== TripStatus.DISPATCHED) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Only dispatched trips can be completed."));
  }

  // Allow finalOdometer = 0 for vehicles with no odometer tracking; just require it's >= current
  if (finalOdometer > 0 && finalOdometer < trip.vehicle.odometer) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", `Final odometer (${finalOdometer} km) cannot be less than current odometer (${trip.vehicle.odometer} km).`));
  }

  try {
    const transactions: any[] = [
      prisma.trip.update({
        where: { id },
        data: { status: TripStatus.COMPLETED, completedAt: new Date() }
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE, odometer: finalOdometer }
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE }
      })
    ];

    // If fuel was consumed, log it
    if (fuelLiters > 0 && fuelCost > 0) {
      transactions.push(
        prisma.fuelLog.create({
          data: {
            liters: fuelLiters,
            cost: fuelCost,
            date: new Date(),
            vehicleId: trip.vehicleId
          }
        })
      );
    }

    await prisma.$transaction(transactions);
  } catch (error) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Failed to complete the trip."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(TRIPS_PATH, "message", "Trip completed successfully."));
}

export async function cancelTrip(formData: FormData) {
  const session = await getServerSession();
  if (!session || !canManagePath(session.role, "/trips")) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Unauthorized."));
  }

  const id = readString(formData, "id");

  if (!id) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Missing trip ID."));
  }

  const trip = await prisma.trip.findUnique({
    where: { id }
  });

  if (!trip) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Trip not found."));
  }

  try {
    if (trip.status === TripStatus.DISPATCHED) {
      // Restore both vehicle and driver to AVAILABLE
      await prisma.$transaction([
        prisma.trip.update({
          where: { id },
          data: { status: TripStatus.CANCELLED }
        }),
        prisma.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: VehicleStatus.AVAILABLE }
        }),
        prisma.driver.update({
          where: { id: trip.driverId },
          data: { status: DriverStatus.AVAILABLE }
        })
      ]);
    } else {
      // Just cancel the draft
      await prisma.trip.update({
        where: { id },
        data: { status: TripStatus.CANCELLED }
      });
    }
  } catch (error) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Failed to cancel the trip."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(TRIPS_PATH, "message", "Trip cancelled."));
}

export async function deleteTrip(formData: FormData) {
  const session = await getServerSession();
  if (!session || !canManagePath(session.role, "/trips")) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Unauthorized."));
  }

  const id = readString(formData, "id");

  if (!id) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Missing trip ID."));
  }

  try {
    await prisma.trip.delete({
      where: { id }
    });
  } catch (error) {
    redirectTo(buildRedirectPath(TRIPS_PATH, "error", "Failed to delete the trip."));
  }

  revalidatePath("/", "layout");
  redirectTo(buildRedirectPath(TRIPS_PATH, "message", "Trip deleted."));
}
