import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");

    return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedPassword: string) {
    const [scheme, salt, hash] = storedPassword.split("$");

    if (scheme !== "scrypt" || !salt || !hash) {
        return false;
    }

    const derivedKey = scryptSync(password, salt, 64);
    const storedKey = Buffer.from(hash, "hex");

    if (storedKey.length !== derivedKey.length) {
        return false;
    }

    return timingSafeEqual(storedKey, derivedKey);
}

export function createPasswordResetToken() {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return { token, tokenHash, expiresAt };
}

export function hashPasswordResetToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetCode() {
    const code = `${randomInt(100000, 999999)}`;
    const codeHash = createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return { code, codeHash, expiresAt };
}

export function hashPasswordResetCode(code: string) {
    return createHash("sha256").update(code.trim()).digest("hex");
}