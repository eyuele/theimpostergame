import { createContext, useContext } from "react";

export const AuthContext = createContext<{ username: string } | null>(null);

export function useUser() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useUser must be inside RequiredLogin");
    return ctx;
}
