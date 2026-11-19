import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useUser } from "./authcontext";
import "./styles/layout.css";

export default function Layout() {
    const navigate = useNavigate();
    const user = useUser().user;
    const API_URL = import.meta.env.VITE_API_URL || "";

    const navs = ["home", "play", "Profile"];
    const [ishidden, setIshidden] = useState(true);
    const [isLoading, setLoading] = useState(false);
    const badge = "2";

    const site_name = "impostersup";

    const handleHidden = () => {
        setIshidden(prev => !prev);
    };
    const loggoutHandler = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/logout`, {
                method: "POST",
                credentials: "include",
            });

            const textdata = await res.text();
            let data;
            if (textdata !== "") {
                data = JSON.parse(textdata);
            }
            if (!res.ok) {
                throw new Error(`${data}`);
            }
            navigate("/auth");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="layout-container">
            <header className="top-bar">
                <div className="bar-container">
                    <h3>{site_name}</h3>
                    <div className="player-detail">
                        <img className="pfp-img" src={`/pfp/${user.avatar_url}.webp`} />

                        <p>{user.username}</p>

                        <img className="name-bage" src={`/badges/badge_${badge}.gif`} />
                    </div>

                    <div className="hamburger-menu" onClick={handleHidden}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </header>
            {!ishidden && (
                <nav className="navigation">
                    <ul>
                        {navs.map(n => (
                            <div>
                                <NavLink key={n} onClick={handleHidden} className={"nav-li"} to={`/${n}`}>
                                    {n}
                                </NavLink>
                                <span className="divider-purple"></span>
                            </div>
                        ))}

                        <button className="loggout-btn" onClick={loggoutHandler}>
                            {isLoading === true ? "Loading..." : "Logout"}
                        </button>
                        <span className="divider-purple"></span>
                    </ul>
                </nav>
            )}
            <main>
                <Outlet />
            </main>
        </div>
    );
}
