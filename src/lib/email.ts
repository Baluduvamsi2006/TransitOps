import nodemailer from "nodemailer";

type PasswordResetMail = {
    to: string;
    name: string;
    resetUrl: string;
};

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetMail) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT ?? "587");
    const smtpSecure = process.env.SMTP_SECURE === "true";
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM ?? smtpUser ?? "TransitOps <no-reply@transitops.local>";

    if (!smtpHost) {
        console.info(`[TransitOps] Password reset for ${to}: ${resetUrl}`);
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
        subject: "TransitOps password reset",
        text: `Hi ${name},\n\nUse this link to reset your TransitOps password:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #1f1b15; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">TransitOps password reset</h2>
        <p style="margin: 0 0 16px;">Hi ${name},</p>
        <p style="margin: 0 0 16px;">Use the button below to set a new password.</p>
        <p style="margin: 0 0 24px;">
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#e08a2e;color:#16110b;text-decoration:none;border-radius:10px;font-weight:700;">Reset password</a>
        </p>
        <p style="margin: 0 0 10px;">If the button does not work, paste this URL into your browser:</p>
        <p style="word-break: break-all; margin: 0 0 16px;">${resetUrl}</p>
        <p style="margin: 0; color: #6d6659;">If you did not request this reset, you can ignore this message.</p>
      </div>
    `
    });
}