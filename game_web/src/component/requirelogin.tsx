import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";
import { AuthContext } from "../pages/authcontext";

export default function RequiredLogin({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState("loading");
    const [username, setUsername] = useState("");

    useEffect(() => {
        fetch("/api/me")
            .then(async res => {
                if (res.ok) {
                    const data = await res.json();
                    setUsername(data.username);
                    setStatus("in");
                } else {
                    setStatus("out");
                }
            })
            .catch(() => setStatus("out"));
    }, []);

    if (status === "loading") return <p>Loading...</p>;
    if (status === "out") return <Navigate to="/auth" replace />;
    return <AuthContext.Provider value={{ username }}>{children}</AuthContext.Provider>;
}
