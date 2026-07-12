"use client";

import { createContext, useContext } from "react";

import type { SessionInfo } from "../lib/jwt";

const SessionContext = createContext<SessionInfo | null>(null);

type SessionProviderProps = {
    initialSession: SessionInfo | null;
    children: React.ReactNode;
};

export function SessionProvider({ initialSession, children }: SessionProviderProps) {
    return <SessionContext.Provider value={initialSession}>{children}</SessionContext.Provider>;
}

export function useSession() {
    return useContext(SessionContext);
}