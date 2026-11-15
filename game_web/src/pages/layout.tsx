import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useUser } from "./authcontext";
import "./styles/layout.css";

export default function Layout() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "";
    const username = useUser().username;
    const navs = ["play", "Profile"];
    const [ishidden, setIshidden] = useState(true);
    const [isLoading, setLoading] = useState(false);
    const pfpChoice = "32";
    const badge = "2";

    const handleHidden = () => {
        setIshidden(prev => !prev);
    };
    const loggoutHandler = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/logout`);

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
                    <div className="player-detail">
                        <img className="pfp-img" src={`/pfp/pfp_${pfpChoice}.webp`} />

                        <p>{username}</p>
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
                                <NavLink key={n} className={"nav-li"} to={`/${n}`}>
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
