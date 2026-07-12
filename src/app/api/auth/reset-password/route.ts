import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import { hashPassword, hashPasswordResetCode } from "../../../../lib/password";

type ResetPasswordBody = {
    email?: string;
    code?: string;
    password?: string;
};

export async function POST(request: NextRequest) {
    const body = (await request.json()) as ResetPasswordBody;
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();
    const password = body.password ?? "";

    if (!email || !code || !password) {
        return NextResponse.json({ message: "Email, code, and new password are required." }, { status: 400 });
    }

    const codeHash = hashPasswordResetCode(code);
    const user = await prisma.user.findFirst({
        where: {
            email,
            passwordResetToken: codeHash,
            passwordResetExpiresAt: {
                gt: new Date()
            }
        }
    });

    if (!user) {
        return NextResponse.json({ message: "The code is invalid or has expired." }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashPassword(password),
            passwordResetToken: null,
            passwordResetExpiresAt: null,
            passwordChangedAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null
        }
    });

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
}