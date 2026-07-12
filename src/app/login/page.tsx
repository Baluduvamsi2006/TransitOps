import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthFrame } from "../../components/auth/auth-frame";
import { LoginForm } from "../../components/auth/login-form";
import { readSessionToken, SESSION_COOKIE_NAME, getLandingPathForRole, toSessionInfo } from "../../lib/jwt";

export const metadata: Metadata = {
    title: "TransitOps | Login",
    description: "Sign in to TransitOps with a role-aware JWT session"
};

export default async function LoginPage() {
    const cookieStore = await cookies();
    const sessionToken = await readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

    if (sessionToken) {
        redirect(getLandingPathForRole(toSessionInfo(sessionToken).role));
    }

    return (
        <AuthFrame
            eyebrow="Authentication"
            title="Sign in to your account"
            description="Use the role assigned by the admin team. TransitOps locks the session to that role and redirects to the matching area after login."
            bullets={[
                "No self-service signup is exposed. Users are created by admins in the database.",
                "Select the role assigned to your record before you sign in.",
                "Forgot password is email-only and sends a one-time reset link.",
                "JWT sessions keep the login flow stateless and role-aware."
            ]}
        >
            <LoginForm />
        </AuthFrame>
    );
}