"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createMaintenanceLog(formData: FormData) {
    const vehicleExt = formData.get("vehicleExt") as string;
    const description = formData.get("description") as string;
    const cost = parseFloat((formData.get("cost") as string) || "0");

    const match = vehicleExt ? vehicleExt.match(/\[(.*?)\]$/) : null;
    const vehicleId = match ? match[1] : null;

    if (!vehicleId || !description) {
        throw new Error("Vehicle and service type are required. Please select from the dropdown options.");
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

    revalidatePath("/", "layout");
}

export async function closeMaintenanceLog(formData: FormData) {
    const logId = formData.get("id") as string;

    if (!logId) {
        throw new Error("Log ID is required");
    }

    const log = await prisma.maintenanceLog.findUnique({
        where: { id: logId },
        include: { vehicle: true }
    });

    if (!log) throw new Error("Log not found");

    const transactions: any[] = [
        prisma.maintenanceLog.update({
            where: { id: logId },
            data: { isOpen: false }
        })
    ];

    // Comply with Rule 10: "Closing maintenance restores the vehicle to Available (unless retired)"
    if (log.vehicle.status !== "RETIRED") {
        transactions.push(
            prisma.vehicle.update({
                where: { id: log.vehicleId },
                data: { status: "AVAILABLE" }
            })
        );
    }

    await prisma.$transaction(transactions);

    revalidatePath("/", "layout");
}
