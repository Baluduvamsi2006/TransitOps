import type { Metadata } from "next";

import { AuthFrame } from "../../components/auth/auth-frame";
import { ResetPasswordForm } from "../../components/auth/reset-password-form";

type ResetPasswordPageProps = {
    searchParams?: { token?: string } | Promise<{ token?: string }>;
};

export const metadata: Metadata = {
    title: "TransitOps | Reset Password",
    description: "Set a new TransitOps password using your reset email link"
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;

    return (
        <AuthFrame
            eyebrow="Reset token"
            title="Set a new password"
            description="Use the secure token from your email to update your credentials and return to the sign-in screen."
            bullets={[
                "Passwords are re-hashed before being stored in the database.",
                "The reset token is invalidated once the password changes.",
                "If the link has expired, request a fresh reset email."
            ]}
        >
            <ResetPasswordForm token={resolvedSearchParams?.token ?? null} />
        </AuthFrame>
    );
}