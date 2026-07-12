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
            title="Request a verification code"
            description="TransitOps sends a one-time verification code to the registered email address."
            bullets={[
                "The code expires after a short window for safety.",
                "No role change happens during reset; the account keeps its DB role.",
                "If SMTP is not configured yet, the code is written to the server log in development."
            ]}
        >
            <ForgotPasswordForm />
        </AuthFrame>
    );
}