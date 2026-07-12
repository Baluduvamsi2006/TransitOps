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

    revalidatePath("/fleet");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { success: false, error: "A vehicle with this registration number already exists." };
    }
    return { success: false, error: "Failed to add vehicle. Please try again." };
  }
}
