import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";
import { AuthContext, type UserData } from "../pages/authcontext";

export default function RequiredLogin({ children }: { children: ReactNode }) {
    const API_URL = import.meta.env.VITE_API_URL || "";
    const [status, setStatus] = useState("loading");
    const [userData, setUserData] = useState<UserData | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/api/me`, {
            credentials: "include",
        })
            .then(async res => {
                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                    setStatus("in");
                } else {
                    setStatus("out");
                }
            })
            .catch(() => setStatus("out"));
    }, []);

    if (status === "loading") return <p>Loading...</p>;
    if (status === "out") return <Navigate to="/auth" replace />;
    if (!userData) return <p>Loading...</p>;
    return <AuthContext.Provider value={{ user: userData, setUser: setUserData }}>{children}</AuthContext.Provider>;
}
