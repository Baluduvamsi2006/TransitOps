import type { Role } from "@prisma/client";
import { cookies } from "next/headers";

import { getLandingPathForRole } from "./rbac";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export const SESSION_COOKIE_NAME = "transitops_session";
const JWT_SECRET = process.env.JWT_SECRET ?? "transitops-dev-secret-change-me";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionInfo = {
    userId: string;
    email: string;
    name: string;
    role: Role;
};

type SessionToken = SessionInfo & {
    iat: number;
    exp: number;
};

export type SessionTokenInfo = SessionToken;

function toBase64Url(data: Uint8Array) {
    let binary = "";

    for (const byte of data) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(data: string) {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

async function getHmacKey() {
    return crypto.subtle.importKey(
        "raw",
        textEncoder.encode(JWT_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
    );
}

export async function signSession(session: SessionInfo, expiresInSeconds = SESSION_TTL_SECONDS) {
    const header = toBase64Url(textEncoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
    const issuedAt = Math.floor(Date.now() / 1000);
    const payload: SessionToken = {
        ...session,
        iat: issuedAt,
        exp: issuedAt + expiresInSeconds
    };
    const encodedPayload = toBase64Url(textEncoder.encode(JSON.stringify(payload)));
    const signingInput = `${header}.${encodedPayload}`;
    const key = await getHmacKey();
    const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, textEncoder.encode(signingInput)));

    return `${signingInput}.${toBase64Url(signature)}`;
}

export async function verifySession(token: string): Promise<SessionToken | null> {
    const parts = token.split(".");

    if (parts.length !== 3) {
        return null;
    }

    const [headerPart, payloadPart, signaturePart] = parts;
    const key = await getHmacKey();
    const isValid = await crypto.subtle.verify(
        "HMAC",
        key,
        fromBase64Url(signaturePart),
        textEncoder.encode(`${headerPart}.${payloadPart}`)
    );

    if (!isValid) {
        return null;
    }

    const payload = JSON.parse(textDecoder.decode(fromBase64Url(payloadPart))) as SessionToken;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp < now) {
        return null;
    }

    return payload;
}

export async function readSessionToken(cookieValue?: string | null) {
    if (!cookieValue) {
        return null;
    }

    return verifySession(cookieValue);
}

export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_TTL_SECONDS
    };
}

export function toSessionInfo(session: SessionToken): SessionInfo {
    return {
        userId: session.userId,
        email: session.email,
        name: session.name,
        role: session.role
    };
}

export { getLandingPathForRole };

export async function getServerSession() {
    const cookieStore = await cookies();
    return readSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}