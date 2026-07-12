"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMaintenanceLog(formData: FormData) {
    const vehicleId = formData.get("vehicleId") as string;
    const description = formData.get("description") as string;
    const cost = parseFloat((formData.get("cost") as string) || "0");

    if (!vehicleId || !description) {
        throw new Error("Vehicle and service type are required.");
    }

    // Create log and update vehicle status in a transaction
    await prisma.$transaction([
        prisma.maintenanceLog.create({
            data: {
                vehicleId,
                description,
                cost,
                isOpen: true
            }
        }),
        prisma.vehicle.update({
            where: { id: vehicleId },
            data: { status: "IN_SHOP" }
        })
    ]);

    revalidatePath("/maintenance");
    revalidatePath("/trips");
    revalidatePath("/fleet");
}

export async function closeMaintenanceLog(formData: FormData) {
    const logId = formData.get("id") as string;

    if (!logId) {
        throw new Error("Log ID is required");
    }

    const log = await prisma.maintenanceLog.findUnique({
        where: { id: logId }
    });

    if (!log) throw new Error("Log not found");

    await prisma.$transaction([
        prisma.maintenanceLog.update({
            where: { id: logId },
            data: { isOpen: false }
        }),
        // If the vehicle was retired while in shop, we probably shouldn't set it to available.
        // However, the rule states we return it to AVAILABLE. We'll enforce basic flow.
        prisma.vehicle.update({
            where: { id: log.vehicleId },
            data: { status: "AVAILABLE" }
        })
    ]);

    revalidatePath("/maintenance");
    revalidatePath("/trips");
    revalidatePath("/fleet");
}
