import nodemailer from "nodemailer";

type PasswordResetMail = {
    to: string;
    name: string;
    code: string;
};

export async function sendPasswordResetEmail({ to, name, code }: PasswordResetMail) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT ?? "587");
    const smtpSecure = process.env.SMTP_SECURE === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM ?? smtpUser ?? "TransitOps <no-reply@transitops.local>";

    if (!smtpHost) {
        console.info(`[TransitOps] Password reset code for ${to}: ${code}`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: smtpUser
            ? {
                user: smtpUser,
                pass: smtpPassword ?? ""
            }
            : undefined
    });

    await transporter.sendMail({
        from,
        to,
        subject: "TransitOps verification code",
        text: `Hi ${name},\n\nYour TransitOps verification code is: ${code}\n\nUse it on the reset password screen to set a new password. If you did not request this, ignore this email.`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #1f1b15; line-height: 1.6;">
            <h2 style="margin: 0 0 12px;">TransitOps verification code</h2>
        <p style="margin: 0 0 16px;">Hi ${name},</p>
            <p style="margin: 0 0 16px;">Use this code on the reset password screen:</p>
            <p style="margin: 0 0 24px; font-size: 28px; font-weight: 700; letter-spacing: 0.24em;">${code}</p>
            <p style="margin: 0; color: #6d6659;">If you did not request this reset, you can ignore this message.</p>
      </div>
    `
    });
}