"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";

export async function addVehicle(formData: FormData) {
  try {
    const registrationNumber = formData.get("registrationNumber") as string;
    const nameModel = formData.get("nameModel") as string;
    const type = formData.get("type") as string;
    const maxLoadCapacity = parseFloat(formData.get("maxLoadCapacity") as string);
    const acquisitionCost = parseFloat(formData.get("acquisitionCost") as string);

    if (!registrationNumber || !nameModel || !type || isNaN(maxLoadCapacity) || isNaN(acquisitionCost)) {
      return { success: false, error: "Invalid form data. Please fill out all fields correctly." };
    }

    await prisma.vehicle.create({
      data: {
        registrationNumber,
        nameModel,
        type,
        maxLoadCapacity,
        acquisitionCost,
        status: "AVAILABLE",
        odometer: 0,
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "A vehicle with this registration number already exists." };
    }
    return { success: false, error: "Failed to add vehicle. Please try again." };
  }
}

export async function updateVehicleStatus(id: string, status: string) {
  try {
    await prisma.vehicle.update({
      where: { id },
      data: { status: status as any },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update status." };
  }
}

export async function editVehicleDetails(id: string, formData: FormData) {
  try {
    const nameModel = formData.get("nameModel") as string;
    const maxLoadCapacity = parseFloat(formData.get("maxLoadCapacity") as string);
    const odometer = parseFloat(formData.get("odometer") as string);

    if (!nameModel || isNaN(maxLoadCapacity) || isNaN(odometer)) {
      return { success: false, error: "Invalid data." };
    }

    await prisma.vehicle.update({
      where: { id },
      data: { nameModel, maxLoadCapacity, odometer },
    });
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update vehicle details." };
  }
}
