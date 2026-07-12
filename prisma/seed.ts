import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Deleting existing records...");
  await prisma.trip.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.vehicle.deleteMany();

  const indianVehicles: Prisma.VehicleCreateInput[] = [
    {
      registrationNumber: "MH01AB1234",
      nameModel: "Tata Ace Gold",
      type: "Mini Truck",
      maxLoadCapacity: 750,
      acquisitionCost: 450000,
      status: "AVAILABLE",
      odometer: 15200,
    },
    {
      registrationNumber: "MH02CD5678",
      nameModel: "Mahindra Bolero Pik-Up",
      type: "Mini Truck",
      maxLoadCapacity: 1700,
      acquisitionCost: 850000,
      status: "AVAILABLE",
      odometer: 34500,
    },
    {
      registrationNumber: "KA51HG8921",
      nameModel: "Ashok Leyland Dost+",
      type: "Mini Truck",
      maxLoadCapacity: 1500,
      acquisitionCost: 750000,
      status: "ON_TRIP",
      odometer: 42000,
    },
    {
      registrationNumber: "KA04XY9999",
      nameModel: "Maruti Suzuki Eeco Cargo",
      type: "Van",
      maxLoadCapacity: 500,
      acquisitionCost: 550000,
      status: "ON_TRIP",
      odometer: 8900,
    },
    {
      registrationNumber: "DL01ZA9988",
      nameModel: "Eicher Pro 2049",
      type: "Truck",
      maxLoadCapacity: 4900,
      acquisitionCost: 1200000,
      status: "AVAILABLE",
      odometer: 8500,
    },
    {
      registrationNumber: "GJ01XY5678",
      nameModel: "Tata LPT 1918",
      type: "Heavy Duty",
      maxLoadCapacity: 18500,
      acquisitionCost: 2400000,
      status: "IN_SHOP",
      odometer: 112000,
    },
    {
      registrationNumber: "TN09AB1111",
      nameModel: "Ashok Leyland U-4220",
      type: "Heavy Duty",
      maxLoadCapacity: 42000,
      acquisitionCost: 3800000,
      status: "RETIRED",
      odometer: 450000,
    },
    {
      registrationNumber: "UP16CD2222",
      nameModel: "Tata Winger Cargo",
      type: "Van",
      maxLoadCapacity: 1200,
      acquisitionCost: 1100000,
      status: "AVAILABLE",
      odometer: 23400,
    }
  ];

  console.log("Seeding database with Indian vehicles...");
  
  for (const v of indianVehicles) {
    await prisma.vehicle.upsert({
      where: { registrationNumber: v.registrationNumber },
      update: {},
      create: v,
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
