const { PrismaClient, Role } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { randomBytes, scryptSync } = require("crypto");
const fs = require("fs");

// Read DATABASE_URL directly from .env file
const envContent = fs.readFileSync(".env", "utf8");
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!match) throw new Error("No DATABASE_URL found in .env");
const databaseUrl = match[1];

const prisma = new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString: databaseUrl }))
});

function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `scrypt$${salt}$${derivedKey}`;
}

const usersToSeed = [
    { email: "superadmin@transitops.in", password: "SuperAdmin@12345", name: "Super Admin", role: Role.SUPER_ADMIN },
    { email: "dummy.user@transitops.in", password: "DummyUser@12345", name: "Dummy Fleet Manager", role: Role.FLEET_MANAGER },
    { email: "dummy2@transitops.in", password: "Dummy2@12345", name: "Dummy 2 Dispatcher", role: Role.DISPATCHER },
];

async function main() {
    for (const u of usersToSeed) {
        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                name: u.name,
                password: hashPassword(u.password),
                role: u.role,
                failedLoginAttempts: 0,
                lockedUntil: null
            },
            create: {
                name: u.name,
                email: u.email,
                password: hashPassword(u.password),
                role: u.role
            }
        });
        console.log(`Seeded: ${u.email} (${u.role}) / password: ${u.password}`);
    }
    console.log("\nAll users seeded successfully!");
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
