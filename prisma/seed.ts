import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// seed.ts — simple TypeScript seed (runs via ts-node or tsx)
// The production seed that runs via `prisma db seed` is seed.cjs
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting existing records...");
  await prisma.trip.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();

  const indianVehicles = [
    {
      registrationNumber: "MH01AB1234",
      nameModel: "Tata Ace Gold",
      type: "Mini Truck",
      maxLoadCapacity: 750,
      acquisitionCost: 450000,
      status: "AVAILABLE" as const,
      odometer: 15200,
    },
    {
      registrationNumber: "MH02CD5678",
      nameModel: "Mahindra Bolero Pik-Up",
      type: "Mini Truck",
      maxLoadCapacity: 1700,
      acquisitionCost: 850000,
      status: "AVAILABLE" as const,
      odometer: 34500,
    },
    {
      registrationNumber: "KA51HG8921",
      nameModel: "Ashok Leyland Dost+",
      type: "Mini Truck",
      maxLoadCapacity: 1500,
      acquisitionCost: 750000,
      status: "ON_TRIP" as const,
      odometer: 42000,
    },
    {
      registrationNumber: "KA04XY9999",
      nameModel: "Maruti Suzuki Eeco Cargo",
      type: "Van",
      maxLoadCapacity: 500,
      acquisitionCost: 550000,
      status: "ON_TRIP" as const,
      odometer: 8900,
    },
    {
      registrationNumber: "DL01ZA9988",
      nameModel: "Eicher Pro 2049",
      type: "Truck",
      maxLoadCapacity: 4900,
      acquisitionCost: 1200000,
      status: "AVAILABLE" as const,
      odometer: 8500,
    },
    {
      registrationNumber: "GJ01XY5678",
      nameModel: "Tata LPT 1918",
      type: "Heavy Duty",
      maxLoadCapacity: 18500,
      acquisitionCost: 2400000,
      status: "IN_SHOP" as const,
      odometer: 112000,
    },
    {
      registrationNumber: "TN09AB1111",
      nameModel: "Ashok Leyland U-4220",
      type: "Heavy Duty",
      maxLoadCapacity: 42000,
      acquisitionCost: 3800000,
      status: "RETIRED" as const,
      odometer: 450000,
    },
    {
      registrationNumber: "UP16CD2222",
      nameModel: "Tata Winger Cargo",
      type: "Van",
      maxLoadCapacity: 1200,
      acquisitionCost: 1100000,
      status: "AVAILABLE" as const,
      odometer: 23400,
    },
  ];

  console.log("Seeding database with Indian vehicles...");
  for (const v of indianVehicles) {
    await prisma.vehicle.upsert({
      where: { registrationNumber: v.registrationNumber },
      update: {},
      create: v,
    });
  }

  const indianDrivers = [
    {
      name: "Ramesh Kumar",
      licenseNumber: "DL1420101234567",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2028-05-12"),
      contactNumber: "+919876543210",
      safetyScore: 98.5,
      status: "AVAILABLE" as const,
    },
    {
      name: "Suresh Singh",
      licenseNumber: "MH0420159876543",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date("2026-11-20"),
      contactNumber: "+918765432109",
      safetyScore: 92.0,
      status: "ON_TRIP" as const,
    },
    {
      name: "Rajesh Patel",
      licenseNumber: "GJ0120184561239",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2029-01-15"),
      contactNumber: "+917654321098",
      safetyScore: 85.5,
      status: "OFF_DUTY" as const,
    },
    {
      name: "Abdul Khan",
      licenseNumber: "UP1620127894561",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date("2027-08-30"),
      contactNumber: "+916543210987",
      safetyScore: 99.0,
      status: "AVAILABLE" as const,
    },
    {
      name: "Manoj Desai",
      licenseNumber: "MH0120113216549",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2025-10-05"),
      contactNumber: "+919988776655",
      safetyScore: 78.0,
      status: "SUSPENDED" as const,
    },
  ];

  console.log("Seeding database with Indian drivers...");
  for (const d of indianDrivers) {
    await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: d,
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
