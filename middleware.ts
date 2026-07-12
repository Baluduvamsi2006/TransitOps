import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, readSessionToken } from "./src/lib/jwt";
import { canAccessPath, isPublicAuthPath } from "./src/lib/rbac";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (isPublicAuthPath(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico")) {
        return NextResponse.next();
    }

    const session = await readSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);

    if (!session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (!canAccessPath(session.role, pathname)) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};