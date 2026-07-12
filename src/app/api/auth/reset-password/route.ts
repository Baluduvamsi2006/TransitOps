import { NextRequest, NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";
import { hashPassword, hashPasswordResetToken } from "../../../../lib/password";

type ResetPasswordBody = {
    token?: string;
    password?: string;
};

export async function POST(request: NextRequest) {
    const body = (await request.json()) as ResetPasswordBody;
    const token = body.token?.trim();
    const password = body.password ?? "";

    if (!token || !password) {
        return NextResponse.json({ message: "Token and new password are required." }, { status: 400 });
    }

    const tokenHash = hashPasswordResetToken(token);
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: tokenHash,
            passwordResetExpiresAt: {
                gt: new Date()
            }
        }
    });

    if (!user) {
        return NextResponse.json({ message: "The reset link is invalid or has expired." }, { status: 400 });
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashPassword(password),
            passwordResetToken: null,
            passwordResetExpiresAt: null,
            passwordChangedAt: new Date()
        }
    });

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
}