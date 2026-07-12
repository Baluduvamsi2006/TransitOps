import { NextRequest, NextResponse } from "next/server";

import { sendPasswordResetEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { createPasswordResetToken } from "../../../../lib/password";

type ForgotPasswordBody = {
    email?: string;
};

export async function POST(request: NextRequest) {
    const body = (await request.json()) as ForgotPasswordBody;
    const email = body.email?.trim().toLowerCase();

    if (!email) {
        return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        return NextResponse.json({ ok: true, message: "If the email exists, a reset link has been sent." });
    }

    const resetToken = createPasswordResetToken();
    const resetUrl = new URL("/reset-password", request.url);
    resetUrl.searchParams.set("token", resetToken.token);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordResetToken: resetToken.tokenHash,
            passwordResetExpiresAt: resetToken.expiresAt
        }
    });

    await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: resetUrl.toString()
    });

    return NextResponse.json({ ok: true, message: "If the email exists, a reset link has been sent." });
}