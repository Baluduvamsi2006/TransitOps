import { NextRequest, NextResponse } from "next/server";

// ─── Constants ────────────────────────────────────────────────────────────────
const SESSION_COOKIE_NAME = "transitops_session";
const JWT_SECRET = process.env.JWT_SECRET ?? "transitops-dev-secret-change-me";

// ─── Roles & Paths (self-contained, no @prisma/client import) ────────────────
const PUBLIC_AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];

const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
    SUPER_ADMIN:       ["/", "/settings", "/fleet", "/drivers", "/trips", "/maintenance", "/finance", "/reports", "/users"],
    FLEET_MANAGER:     ["/", "/settings", "/fleet", "/drivers", "/reports"],
    DISPATCHER:        ["/", "/settings", "/fleet", "/trips"],
    DRIVER:            ["/", "/settings", "/trips"],
    SAFETY_OFFICER:    ["/", "/settings", "/drivers", "/trips"],
    FINANCIAL_ANALYST: ["/", "/settings", "/fleet", "/finance", "/reports"],
};

function isPublicPath(pathname: string) {
    return PUBLIC_AUTH_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
}

function canAccess(role: string, pathname: string) {
    if (role === "SUPER_ADMIN") return true;
    const allowed = ROLE_ALLOWED_PATHS[role] ?? [];
    const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
    return allowed.some((p) => {
        if (p === "/") return normalized === "/";
        return normalized === p || normalized.startsWith(`${p}/`);
    });
}

// ─── Edge-compatible JWT verification ────────────────────────────────────────
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function fromBase64Url(data: string) {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function verifyToken(token: string) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        const [header, payload, sig] = parts;
        const key = await crypto.subtle.importKey(
            "raw",
            textEncoder.encode(JWT_SECRET),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );
        const valid = await crypto.subtle.verify(
            "HMAC",
            key,
            fromBase64Url(sig),
            textEncoder.encode(`${header}.${payload}`)
        );
        if (!valid) return null;
        const data = JSON.parse(textDecoder.decode(fromBase64Url(payload)));
        if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
        return data as { role: string; userId: string };
    } catch {
        return null;
    }
}

// ─── Proxy (Next.js 16 replacement for middleware) ────────────────────────────
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Always allow public pages and Next.js internals
    if (
        isPublicPath(pathname) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon")
    ) {
        return NextResponse.next();
    }

    // Verify session
    const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = cookieValue ? await verifyToken(cookieValue) : null;

    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check role access
    if (!canAccess(session.role, pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
