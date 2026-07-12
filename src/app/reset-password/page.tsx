import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthFrame } from "../../components/auth/auth-frame";
import { ResetPasswordForm } from "../../components/auth/reset-password-form";

export const metadata: Metadata = {
    title: "TransitOps | Reset Password",
    description: "Set a new TransitOps password using your reset email link"
};

export default function ResetPasswordPage() {
    return (
        <AuthFrame
            eyebrow="Reset code"
            title="Set a new password"
            description="Use the verification code from your email to update your credentials and return to the sign-in screen."
            bullets={[
                "The verification code is invalidated once the password changes.",
                "If the code has expired, request a fresh verification code."
            ]}
        >
            <Suspense fallback={<div className="text-sm text-(--muted) py-4">Loading reset form...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthFrame>
    );
}
