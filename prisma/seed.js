const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, Role, VehicleStatus, DriverStatus, TripStatus } = require("@prisma/client");
const crypto = require("crypto");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const users = [
  {
    email: "manager@transitops.com",
    name: "Fleet Manager",
    password: hashPassword("password123"),
    role: Role.FLEET_MANAGER
  },
  {
    email: "driver@transitops.com",
    name: "Dispatcher Alex",
    password: hashPassword("password123"),
    role: Role.DRIVER
  },
  {
    email: "safety@transitops.com",
    name: "Safety Officer",
    password: hashPassword("password123"),
    role: Role.SAFETY_OFFICER
  },
  {
    email: "finance@transitops.com",
    name: "Financial Analyst",
    password: hashPassword("password123"),
    role: Role.FINANCIAL_ANALYST
  }
];

const vehicles = [
  {
    registrationNumber: "GJ01AB1234",
    nameModel: "Van-05",
    type: "Van",
    maxLoadCapacity: 500,
    odometer: 12000,
    acquisitionCost: 25000,
    status: VehicleStatus.AVAILABLE
  },
  {
    registrationNumber: "GJ03BB9991",
    nameModel: "Truck-08",
    type: "Truck",
    maxLoadCapacity: 8000,
    odometer: 45000,
    acquisitionCost: 75000,
    status: VehicleStatus.ON_TRIP
  },
  {
    registrationNumber: "GJ05CC0850",
    nameModel: "Midi-03",
    type: "Mini Truck",
    maxLoadCapacity: 1000,
    odometer: 8500,
    acquisitionCost: 35000,
    status: VehicleStatus.IN_SHOP
  },
  {
    registrationNumber: "GJ01CD0917",
    nameModel: "Van-09",
    type: "Van",
    maxLoadCapacity: 750,
    odometer: 98000,
    acquisitionCost: 22000,
    status: VehicleStatus.RETIRED
  },
  {
    registrationNumber: "GJ02DD1122",
    nameModel: "Van-12",
    type: "Van",
    maxLoadCapacity: 600,
    odometer: 15400,
    acquisitionCost: 28000,
    status: VehicleStatus.AVAILABLE
  },
  {
    registrationNumber: "GJ07EE3344",
    nameModel: "Truck-03",
    type: "Truck",
    maxLoadCapacity: 6000,
    odometer: 32000,
    acquisitionCost: 65000,
    status: VehicleStatus.AVAILABLE
  }
];

const drivers = [
  {
    name: "Alex Verma",
    licenseNumber: "DL-99135",
    licenseCategory: "LMV",
    licenseExpiryDate: new Date("2027-03-14"),
    contactNumber: "9876543210",
    safetyScore: 94,
    status: DriverStatus.ON_TRIP
  },
  {
    name: "Meera Das",
    licenseNumber: "DL-77213",
    licenseCategory: "HMV",
    licenseExpiryDate: new Date("2026-07-25"),
    contactNumber: "9876501234",
    safetyScore: 96,
    status: DriverStatus.AVAILABLE
  },
  {
    name: "Sam Iyer",
    licenseNumber: "DL-44580",
    licenseCategory: "HMV",
    licenseExpiryDate: new Date("2025-07-01"),
    contactNumber: "9876512345",
    safetyScore: 87,
    status: DriverStatus.SUSPENDED
  },
  {
    name: "Gopal Sen",
    licenseNumber: "DL-48395",
    licenseCategory: "LMV",
    licenseExpiryDate: new Date("2026-08-20"),
    contactNumber: "9876523456",
    safetyScore: 83,
    status: DriverStatus.OFF_DUTY
  },
  {
    name: "Priya Nair",
    licenseNumber: "DL-19031",
    licenseCategory: "LMV",
    licenseExpiryDate: new Date("2027-01-09"),
    contactNumber: "9876534567",
    safetyScore: 91,
    status: DriverStatus.ON_TRIP
  }
];

async function main() {
  // Clear existing records to ensure clean seed
  await prisma.expense.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.user.deleteMany({});

  // Seed Users
  for (const u of users) {
    await prisma.user.create({ data: u });
  }
  console.log(`Seeded ${users.length} users.`);

  // Seed Vehicles
  const seededVehicles = [];
  for (const v of vehicles) {
    const sv = await prisma.vehicle.create({ data: v });
    seededVehicles.push(sv);
  }
  console.log(`Seeded ${seededVehicles.length} vehicles.`);

  // Seed Drivers
  const seededDrivers = [];
  for (const d of drivers) {
    const sd = await prisma.driver.create({ data: d });
    seededDrivers.push(sd);
  }
  console.log(`Seeded ${seededDrivers.length} drivers.`);

  // Helper mapping
  const vehicleMap = {};
  seededVehicles.forEach((v) => { vehicleMap[v.nameModel] = v.id; });

  const driverMap = {};
  seededDrivers.forEach((d) => { driverMap[d.name] = d.id; });

  // Seed Trips
  const trips = [
    {
      source: "Northbridge Depot",
      destination: "Ashapiladad Hub",
      cargoWeight: 450,
      plannedDistance: 96,
      status: TripStatus.DISPATCHED,
      vehicleId: vehicleMap["Van-05"] || seededVehicles[0].id,
      driverId: driverMap["Alex Verma"] || seededDrivers[0].id,
      dispatchedAt: new Date()
    },
    {
      source: "Warehouse 4",
      destination: "Retail Industrial Area",
      cargoWeight: 7500,
      plannedDistance: 62,
      status: TripStatus.COMPLETED,
      vehicleId: vehicleMap["Truck-08"] || seededVehicles[1].id,
      driverId: driverMap["Meera Das"] || seededDrivers[1].id,
      dispatchedAt: new Date(Date.now() - 86400000),
      completedAt: new Date()
    },
    {
      source: "Central Yard",
      destination: "East Terminal",
      cargoWeight: 500,
      plannedDistance: 120,
      status: TripStatus.DRAFT,
      vehicleId: vehicleMap["Truck-03"] || seededVehicles[5].id,
      driverId: driverMap["Meera Das"] || seededDrivers[1].id
    }
  ];

  for (const t of trips) {
    await prisma.trip.create({ data: t });
  }
  console.log(`Seeded trips.`);

  // Seed Maintenance
  const maintLogs = [
    {
      description: "Oil Change & Filter",
      cost: 450,
      date: new Date("2026-07-01"),
      isOpen: true,
      vehicleId: vehicleMap["Midi-03"] || seededVehicles[2].id
    },
    {
      description: "Brake Pads Replacement",
      cost: 1200,
      date: new Date("2026-06-15"),
      isOpen: false,
      vehicleId: vehicleMap["Truck-08"] || seededVehicles[1].id
    }
  ];

  for (const m of maintLogs) {
    await prisma.maintenanceLog.create({ data: m });
  }
  console.log(`Seeded maintenance logs.`);

  // Seed Fuel Logs
  const fuelLogs = [
    {
      liters: 45,
      cost: 135,
      date: new Date("2026-07-05"),
      vehicleId: vehicleMap["Van-05"] || seededVehicles[0].id
    },
    {
      liters: 120,
      cost: 360,
      date: new Date("2026-07-06"),
      vehicleId: vehicleMap["Truck-08"] || seededVehicles[1].id
    }
  ];

  for (const f of fuelLogs) {
    await prisma.fuelLog.create({ data: f });
  }
  console.log(`Seeded fuel logs.`);

  // Seed Expenses
  const expenses = [
    {
      description: "Highway Tolls",
      amount: 45,
      date: new Date("2026-07-05"),
      vehicleId: vehicleMap["Van-05"] || seededVehicles[0].id
    },
    {
      description: "State Permit Tolls",
      amount: 150,
      date: new Date("2026-07-06"),
      vehicleId: vehicleMap["Truck-08"] || seededVehicles[1].id
    }
  ];

  for (const e of expenses) {
    await prisma.expense.create({ data: e });
  }
  console.log(`Seeded expenses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });