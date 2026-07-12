import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/password";

export async function GET() {
    const users = [
        { email: "superadmin@transitops.in", password: "SuperAdmin@12345", name: "Super Admin", role: "SUPER_ADMIN" as const },
        { email: "dummy.user@transitops.in", password: "DummyUser@12345", name: "Dummy Fleet Manager", role: "FLEET_MANAGER" as const },
        { email: "dummy2@transitops.in", password: "Dummy2@12345", name: "Dummy 2 Dispatcher", role: "DISPATCHER" as const },
    ];

    const results = [];
    for (const u of users) {
        const result = await prisma.user.upsert({
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
        results.push({ email: result.email, role: result.role });
    }

    return NextResponse.json({ ok: true, seeded: results });
}
