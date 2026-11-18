import { createContext, useContext } from "react";

export interface UserData {
    username: string;
    avatar_url: string;
    id: string;
}
export const AuthContext = createContext<{
    user: UserData;
    setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
} | null>(null);

export function useUser() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useUser must be inside RequiredLogin");
    return ctx;
}
