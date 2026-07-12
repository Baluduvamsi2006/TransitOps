import "dotenv/config";
import { PrismaClient, Prisma } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Deleting existing records (except users)...");
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();

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

  console.log("Seeding Vehicles...");
  for (const v of indianVehicles) {
    await prisma.vehicle.create({ data: v });
  }

  const indianDrivers: Prisma.DriverCreateInput[] = [
    {
      name: "Ramesh Kumar",
      licenseNumber: "DL1420101234567",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2028-05-12"),
      contactNumber: "+919876543210",
      safetyScore: 98.5,
      status: "AVAILABLE",
    },
    {
      name: "Suresh Singh",
      licenseNumber: "MH0420159876543",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date("2026-11-20"),
      contactNumber: "+918765432109",
      safetyScore: 92.0,
      status: "ON_TRIP",
    },
    {
      name: "Rajesh Patel",
      licenseNumber: "GJ0120184561239",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2029-01-15"),
      contactNumber: "+917654321098",
      safetyScore: 85.5,
      status: "OFF_DUTY",
    },
    {
      name: "Abdul Khan",
      licenseNumber: "UP1620127894561",
      licenseCategory: "LMV",
      licenseExpiryDate: new Date("2027-08-30"),
      contactNumber: "+916543210987",
      safetyScore: 99.0,
      status: "AVAILABLE",
    },
    {
      name: "Manoj Desai",
      licenseNumber: "MH0120113216549",
      licenseCategory: "HMV",
      licenseExpiryDate: new Date("2025-10-05"),
      contactNumber: "+919988776655",
      safetyScore: 78.0,
      status: "SUSPENDED",
    },
  ];

  console.log("Seeding Drivers...");
  for (const d of indianDrivers) {
    await prisma.driver.create({ data: d });
  }

  const vehicles = await prisma.vehicle.findMany();
  const drivers = await prisma.driver.findMany();

  const vAvailable = vehicles.filter(v => v.status === "AVAILABLE");
  const vOnTrip = vehicles.filter(v => v.status === "ON_TRIP");
  const dAvailable = drivers.filter(d => d.status === "AVAILABLE");
  const dOnTrip = drivers.filter(d => d.status === "ON_TRIP");

  console.log("Seeding Trips...");
  const now = new Date();
  
  // Create 10 completed trips spread over last 6 months
  for(let i=0; i<10; i++) {
    const v = vehicles[i % vehicles.length];
    const d = drivers[i % drivers.length];
    const pastDate = new Date(now.getTime() - (Math.random() * 150 * 24 * 60 * 60 * 1000));
    const completedDate = new Date(pastDate.getTime() + (Math.random() * 2 * 24 * 60 * 60 * 1000));
    const distance = 150 + Math.floor(Math.random() * 400);

    await prisma.trip.create({
      data: {
        source: ["Mumbai", "Delhi", "Pune", "Bangalore", "Chennai"][i % 5],
        destination: ["Ahmedabad", "Surat", "Jaipur", "Hyderabad", "Kolkata"][(i+1) % 5],
        cargoWeight: Math.floor(v.maxLoadCapacity * 0.8),
        plannedDistance: distance,
        status: "COMPLETED",
        vehicleId: v.id,
        driverId: d.id,
        createdAt: pastDate,
        dispatchedAt: pastDate,
        completedAt: completedDate,
      }
    });

    // Add Fuel and Maintenance for this vehicle occasionally
    await prisma.fuelLog.create({
      data: {
        liters: distance / 10,
        cost: (distance / 10) * 95, // 95 rupees per liter
        date: completedDate,
        vehicleId: v.id
      }
    });

    if (i % 3 === 0) {
        await prisma.maintenanceLog.create({
            data: {
                description: "Standard Servicing & Oil Change",
                cost: 2500 + Math.random() * 3000,
                isOpen: false,
                date: pastDate,
                vehicleId: v.id,
            }
        });
    }

    if (i % 2 === 0) {
        await prisma.expense.create({
            data: {
                description: "Toll Tax & Parking",
                amount: 300 + Math.random() * 500,
                date: completedDate,
                vehicleId: v.id
            }
        });
    }
  }

  // Create Active Trips (Dispatched)
  if (vOnTrip.length > 0 && dOnTrip.length > 0) {
      await prisma.trip.create({
        data: {
            source: "Mumbai",
            destination: "Pune",
            cargoWeight: 1000,
            plannedDistance: 160,
            status: "DISPATCHED",
            vehicleId: vOnTrip[0].id,
            driverId: dOnTrip[0].id,
            dispatchedAt: new Date(),
        }
      });
  }

  // Create Draft Trip
  if (vAvailable.length > 0 && dAvailable.length > 0) {
    await prisma.trip.create({
        data: {
            source: "Delhi",
            destination: "Agra",
            cargoWeight: 400,
            plannedDistance: 240,
            status: "DRAFT",
            vehicleId: vAvailable[0].id,
            driverId: dAvailable[0].id,
        }
    });
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
