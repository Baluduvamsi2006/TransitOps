import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";

import { SessionProvider } from "../components/session-provider";
import { SESSION_COOKIE_NAME, readSessionToken, toSessionInfo } from "../lib/jwt";

export const metadata: Metadata = {
  title: "TransitOps",
  description: "Smart transport operations platform"
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionToken = await readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const session = sessionToken ? toSessionInfo(sessionToken) : null;

  return (
    <html lang="en">
      <body>
        <SessionProvider initialSession={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}