import { NextRequest, NextResponse } from "next/server";

import { sendPasswordResetEmail } from "../../../../lib/email";
import { prisma } from "../../../../lib/prisma";
import { createPasswordResetCode } from "../../../../lib/password";

type ForgotPasswordBody = {
    email?: string;
};

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ForgotPasswordBody;
        const email = body.email?.trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ message: "Email is required." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return NextResponse.json(
                { message: "No account found with this email address." },
                { status: 404 }
            );
        }

        const resetCode = createPasswordResetCode();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetCode.codeHash,
                passwordResetExpiresAt: resetCode.expiresAt
            }
        });

        await sendPasswordResetEmail({
            to: user.email,
            name: user.name,
            code: resetCode.code
        });

        // In development (no SMTP), return the code in the response so it can be shown on screen
        const isDevMode = !process.env.SMTP_HOST;
        return NextResponse.json({
            ok: true,
            message: "If the email exists, a verification code has been sent.",
            ...(isDevMode ? { devCode: resetCode.code } : {})
        });
    } catch (error) {
        console.error("[forgot-password] Unexpected error:", error);
        return NextResponse.json({ message: "Internal server error. Please try again." }, { status: 500 });
    }
}