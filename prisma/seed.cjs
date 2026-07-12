const { PrismaClient, Role } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { randomBytes, scryptSync } = require("crypto");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the Prisma seed script.");
}

const prisma = new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString: databaseUrl }))
});

function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `scrypt$${salt}$${derivedKey}`;
}

async function main() {
    const superAdminEmail = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@transitops.in";
    const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD || "SuperAdmin@12345";
    const dummyEmail = process.env.SEED_DUMMY_EMAIL || "dummy.user@transitops.in";
    const dummyPassword = process.env.SEED_DUMMY_PASSWORD || "DummyUser@12345";

    await prisma.user.upsert({
        where: { email: superAdminEmail },
        update: {
            name: "Super Admin",
            password: hashPassword(superAdminPassword),
            role: Role.SUPER_ADMIN
        },
        create: {
            name: "Super Admin",
            email: superAdminEmail,
            password: hashPassword(superAdminPassword),
            role: Role.SUPER_ADMIN
        }
    });

    await prisma.user.upsert({
        where: { email: dummyEmail },
        update: {
            name: "Dummy Fleet Manager",
            password: hashPassword(dummyPassword),
            role: Role.FLEET_MANAGER
        },
        create: {
            name: "Dummy Fleet Manager",
            email: dummyEmail,
            password: hashPassword(dummyPassword),
            role: Role.FLEET_MANAGER
        }
    });

    console.log("Seeded super admin and dummy user.");
    console.log(`Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
    console.log(`Dummy User: ${dummyEmail} / ${dummyPassword}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });