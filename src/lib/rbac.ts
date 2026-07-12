import type { Role } from "@prisma/client";

export const roleLabels: Record<Role, string> = {
    SUPER_ADMIN: "Super Admin",
    FLEET_MANAGER: "Fleet Manager",
    DISPATCHER: "Dispatcher",
    DRIVER: "Driver",
    SAFETY_OFFICER: "Safety Officer",
    FINANCIAL_ANALYST: "Financial Analyst"
};

export const roleLandingPaths: Record<Role, string> = {
    SUPER_ADMIN: "/",
    FLEET_MANAGER: "/",
    DISPATCHER: "/",
    DRIVER: "/",
    SAFETY_OFFICER: "/",
    FINANCIAL_ANALYST: "/"
};

export const roleAllowedPaths: Record<Role, string[]> = {
    SUPER_ADMIN: ["/", "/settings", "/fleet", "/drivers", "/trips", "/maintenance", "/finance", "/reports", "/users"],
    FLEET_MANAGER: ["/", "/settings", "/fleet", "/drivers", "/reports"],
    DISPATCHER: ["/", "/settings", "/fleet", "/trips"],
    DRIVER: ["/", "/settings", "/trips"],
    SAFETY_OFFICER: ["/", "/settings", "/drivers", "/trips"],
    FINANCIAL_ANALYST: ["/", "/settings", "/fleet", "/finance", "/reports"]
};

export const publicAuthPaths = ["/login", "/forgot-password", "/reset-password"] as const;

export function isPublicAuthPath(pathname: string) {
    return publicAuthPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function canAccessPath(role: Role, pathname: string) {
    if (role === "SUPER_ADMIN") {
        return true;
    }

    const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

    return roleAllowedPaths[role].some((allowedPath) => {
        if (allowedPath === "/") {
            return normalizedPath === "/";
        }

        return normalizedPath === allowedPath || normalizedPath.startsWith(`${allowedPath}/`);
    });
}

export function normalizeRole(role: string | null | undefined): Role | null {
    if (!role) {
        return null;
    }

    return role in roleLabels ? (role as Role) : null;
}

export function getLandingPathForRole(role: Role) {
    return roleLandingPaths[role];
}