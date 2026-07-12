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

        // ── Step 1: Check if user exists with this email ──────────────────────
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json(
                { message: "No account found with this email address." },
                { status: 401 }
            );
        }

        // ── Step 2: Check role match (SUPER_ADMIN bypasses role selection) ────
        if (user.role !== "SUPER_ADMIN" && user.role !== role) {
            return NextResponse.json(
                { message: `No account found with this email for the "${body.role?.replace(/_/g, " ")}" role.` },
                { status: 401 }
            );
        }

        // ── Step 2: Check if account is locked ────────────────────────────────
        const now = new Date();
        if (user.lockedUntil && user.lockedUntil > now) {
            const isFrozen = user.lockedUntil.getFullYear() > 9000;
            return NextResponse.json(
                {
                    message: isFrozen
                        ? "Account is frozen due to 5 consecutive failed login attempts. Contact a Super Admin to unfreeze."
                        : "Account is temporarily locked. Try again later."
                },
                { status: 423 }
            );
        }

        // ── Step 3: Verify password ────────────────────────────────────────────
        const passwordMatches = verifyPassword(password, user.password);

        if (!passwordMatches) {
            const failedAttempts = user.failedLoginAttempts + 1;
            const isLocked = failedAttempts >= 5;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: isLocked ? 5 : failedAttempts,
                    lockedUntil: isLocked ? new Date("9999-12-31T23:59:59Z") : user.lockedUntil
                }
            });

            if (isLocked) {
                return NextResponse.json(
                    { message: "Account frozen due to 5 failed attempts. Contact a Super Admin to unfreeze." },
                    { status: 423 }
                );
            }

            const attemptsLeft = 5 - failedAttempts;
            return NextResponse.json(
                {
                    message: `Incorrect password. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining before the account is frozen.`
                },
                { status: 401 }
            );
        }

        // ── Step 4: Success — create session ──────────────────────────────────
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