import type { Metadata } from "next";

import { AuthFrame } from "../../components/auth/auth-frame";
import { ForgotPasswordForm } from "../../components/auth/forgot-password-form";

export const metadata: Metadata = {
    title: "TransitOps | Forgot Password",
    description: "Request a password reset link for your TransitOps account"
};

export default function ForgotPasswordPage() {
    return (
        <AuthFrame
            eyebrow="Password recovery"
            title="Request a reset email"
            description="TransitOps sends a one-time password reset link to the email address on the account."
            bullets={[
                "The reset link expires after a short window for safety.",
                "No role change happens during reset; the account keeps its DB role.",
                "If SMTP is not configured yet, the link is written to the server log in development."
            ]}
        >
            <ForgotPasswordForm />
        </AuthFrame>
    );
}