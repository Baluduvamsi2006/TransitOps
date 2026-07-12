import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import { getLandingPathForRole, getSessionCookieOptions, signSession, SESSION_COOKIE_NAME } from "../../../../lib/jwt";
import { verifyPassword } from "../../../../lib/password";
import { normalizeRole } from "../../../../lib/rbac";

type LoginBody = {
    email?: string;
    password?: string;
    role?: string;
};

export async function POST(request: NextRequest) {
    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const role = normalizeRole(body.role);

    if (!email || !password || !role) {
        return NextResponse.json({ message: "Email, password, and role are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.password) || user.role !== role) {
        return NextResponse.json({ message: "Invalid email, password, or role." }, { status: 401 });
    }

    const sessionToken = await signSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role
    });

    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });

    const response = NextResponse.json({
        ok: true,
        redirectTo: getLandingPathForRole(user.role),
        role: user.role,
        name: user.name
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

    return response;
}