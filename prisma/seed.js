const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient, DriverStatus } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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
  for (const driver of drivers) {
    await prisma.driver.upsert({
      where: { licenseNumber: driver.licenseNumber },
      update: driver,
      create: driver
    });
  }

  console.log(`Seeded ${drivers.length} drivers.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });