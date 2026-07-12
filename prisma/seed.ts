import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
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
      registrationNumber: "KA51HG8921",
      nameModel: "Ashok Leyland Dost+",
      type: "Mini Truck",
      maxLoadCapacity: 1500,
      acquisitionCost: 750000,
      status: "ON_TRIP",
      odometer: 42000,
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
