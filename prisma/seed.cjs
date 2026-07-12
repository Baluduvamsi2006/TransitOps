const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { randomBytes, scryptSync } = require("crypto");
const fs = require("fs");
const path = require("path");

// Load .env from project root
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
            const idx = trimmed.indexOf("=");
            if (idx !== -1) {
                const key = trimmed.slice(0, idx).trim();
                const val = trimmed.slice(idx + 1).trim().replace(/^"(.*)"$/s, "$1");
                if (!process.env[key]) process.env[key] = val;
            }
        }
    }
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the Prisma seed script.");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
            role: "SUPER_ADMIN",
            failedLoginAttempts: 0,
            lockedUntil: null
        },
        create: {
            name: "Super Admin",
            email: superAdminEmail,
            password: hashPassword(superAdminPassword),
            role: "SUPER_ADMIN"
        }
    });

    await prisma.user.upsert({
        where: { email: dummyEmail },
        update: {
            name: "Dummy Fleet Manager",
            password: hashPassword(dummyPassword),
            role: "FLEET_MANAGER",
            failedLoginAttempts: 0,
            lockedUntil: null
        },
        create: {
            name: "Dummy Fleet Manager",
            email: dummyEmail,
            password: hashPassword(dummyPassword),
            role: "FLEET_MANAGER"
        }
    });

    await prisma.user.upsert({
        where: { email: "dummy2@transitops.in" },
        update: {
            name: "Dummy2 User",
            password: hashPassword("Dummy2@12345"),
            role: "DISPATCHER",
            failedLoginAttempts: 0,
            lockedUntil: null
        },
        create: {
            name: "Dummy2 User",
            email: "dummy2@transitops.in",
            password: hashPassword("Dummy2@12345"),
            role: "DISPATCHER"
        }
    });

    console.log("Seeded super admin and dummy user.");
    console.log(`Super Admin: ${superAdminEmail} / ${superAdminPassword}`);
    console.log(`Dummy User: ${dummyEmail} / ${dummyPassword}`);
    console.log(`Dummy2 User: dummy2@transitops.in / Dummy2@12345`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });