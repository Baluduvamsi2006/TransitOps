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
    try {
        const body = (await request.json()) as LoginBody;
        const email = body.email?.trim().toLowerCase();
        const password = body.password ?? "";
        const role = normalizeRole(body.role);

        if (!email || !password || !role) {
            return NextResponse.json({ message: "Email, password, and role are required." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json({ message: "Invalid email, password, or role." }, { status: 401 });
        }

        const now = new Date();

        if (user.lockedUntil && user.lockedUntil > now) {
            const isFrozen = user.lockedUntil.getFullYear() > 9000;
            return NextResponse.json(
                {
                    message: isFrozen
                        ? "Account is frozen due to 5 consecutive invalid login attempts. Please contact a Super Admin to unfreeze it."
                        : "Account locked. Try again later."
                },
                { status: 423 }
            );
        }

        const passwordMatches = verifyPassword(password, user.password);
        const roleMatches = user.role === role;

        if (!passwordMatches || !roleMatches) {
            const failedAttempts = user.failedLoginAttempts + 1;
            const isLocked = failedAttempts >= 5;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: isLocked ? 5 : failedAttempts,
                    lockedUntil: isLocked ? new Date("9999-12-31T23:59:59Z") : user.lockedUntil
                }
            });

            return NextResponse.json(
                {
                    message: isLocked
                        ? "Account is frozen due to 5 consecutive invalid login attempts. Please contact a Super Admin to unfreeze it."
                        : `Invalid email, password, or role. ${5 - failedAttempts} attempt${(5 - failedAttempts) === 1 ? "" : "s"} left before the account is frozen.`
                },
                { status: isLocked ? 423 : 401 }
            );
        }

        const sessionToken = await signSession({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                failedLoginAttempts: 0,
                lockedUntil: null
            }
        });

        const response = NextResponse.json({
            ok: true,
            redirectTo: getLandingPathForRole(user.role),
            role: user.role,
            name: user.name
        });

        response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());

        return response;
    } catch (error) {
        console.error("[login] Unexpected error:", error);
        return NextResponse.json({ message: "Internal server error. Please try again." }, { status: 500 });
    }
}