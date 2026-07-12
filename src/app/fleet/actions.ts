"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../lib/prisma";
import { getServerSession } from "../../lib/jwt";
import { canManagePath } from "../../lib/rbac";

export async function addVehicle(formData: FormData) {
  try {
    const session = await getServerSession();
    if (!session || !canManagePath(session.role, "/fleet")) {
      return { success: false, error: "Unauthorized: You do not have permission to manage the fleet." };
    }

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
    const session = await getServerSession();
    if (!session || !canManagePath(session.role, "/fleet")) {
      return { success: false, error: "Unauthorized" };
    }

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
    const session = await getServerSession();
    if (!session || !canManagePath(session.role, "/fleet")) {
      return { success: false, error: "Unauthorized" };
    }

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

export async function saveVehicleDocument(id: string, name: string, url: string) {
  try {
    const session = await getServerSession();
    if (!session || !canManagePath(session.role, "/fleet")) {
      return { success: false, error: "Unauthorized" };
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return { success: false, error: "Vehicle not found" };

    const existing = vehicle.documents;
    const docs: { name: string; url: string; dateAdded: string }[] =
      Array.isArray(existing) ? (existing as { name: string; url: string; dateAdded: string }[]) : [];
    docs.push({ name, url, dateAdded: new Date().toISOString() });

    await prisma.vehicle.update({
      where: { id },
      data: { documents: docs },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to save document." };
  }
}

export async function deleteVehicleDocument(id: string, docIndex: number) {
  try {
    const session = await getServerSession();
    if (!session || !canManagePath(session.role, "/fleet")) {
      return { success: false, error: "Unauthorized" };
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) return { success: false, error: "Vehicle not found" };

    const existing = vehicle.documents;
    const docs: { name: string; url: string; dateAdded: string }[] =
      Array.isArray(existing) ? (existing as { name: string; url: string; dateAdded: string }[]) : [];

    if (docIndex >= 0 && docIndex < docs.length) {
      docs.splice(docIndex, 1);
      await prisma.vehicle.update({
        where: { id },
        data: { documents: docs },
      });
      revalidatePath("/", "layout");
      return { success: true };
    }
    return { success: false, error: "Document not found" };
  } catch {
    return { success: false, error: "Failed to delete document." };
  }
}
