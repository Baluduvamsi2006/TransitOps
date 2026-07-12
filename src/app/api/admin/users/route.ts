import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, readSessionToken } from "../../../../lib/jwt";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/password";
import { normalizeRole } from "../../../../lib/rbac";

type AdminUserBody = {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
};

async function requireSuperAdmin(request: NextRequest) {
    const session = await readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

    if (!session || session.role !== "SUPER_ADMIN") {
        return null;
    }

    return session;
}

export async function GET(request: NextRequest) {
    const session = await requireSuperAdmin(request);

    if (!session) {
        return NextResponse.json({ message: "Super admin access required." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            lockedUntil: true,
            failedLoginAttempts: true
        }
    });

    return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
    const session = await requireSuperAdmin(request);

    if (!session) {
        return NextResponse.json({ message: "Super admin access required." }, { status: 403 });
    }

    const body = (await request.json()) as AdminUserBody;
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const role = normalizeRole(body.role);

    if (!name || !email || !password || !role) {
        return NextResponse.json({ message: "Name, email, password, and role are required." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        return NextResponse.json({ message: "A user with this email already exists." }, { status: 409 });
    }

    const createdUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashPassword(password),
            role,
            failedLoginAttempts: 0,
            lockedUntil: null
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
        }
    });

    return NextResponse.json({ user: createdUser }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
    const session = await requireSuperAdmin(request);

    if (!session) {
        return NextResponse.json({ message: "Super admin access required." }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { userId, action } = body;

        if (action === "unfreeze") {
            if (!userId) {
                return NextResponse.json({ message: "User ID is required." }, { status: 400 });
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    failedLoginAttempts: 0,
                    lockedUntil: null
                }
            });

            return NextResponse.json({ ok: true, message: "User unfrozen successfully." });
        }

        return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}