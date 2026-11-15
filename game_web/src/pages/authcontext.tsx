import { createContext, useContext } from "react";

export interface UserData {
    username: string;
    avatar_url: string;
}
export const AuthContext = createContext<UserData | null>(null);

export function useUser() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useUser must be inside RequiredLogin");
    return ctx;
}
