import { useEffect, useState } from "react";
import { useUser } from "./authcontext";
import "./styles/profile.css";
export default function Profile() {
    const { user, setUser } = useUser();

    const API_URL = import.meta.env.VITE_API_URL || "";

    const [ishidden, setishidden] = useState(true);
    const [userpfp, setUserPfp] = useState(`${user.avatar_url}`);

    const PFP_OPTIONS = Array.from({ length: 52 }, (_, index) => `pfp_${index + 1}`);

    const hiddenHandler = () => {
        setishidden(prev => !prev);
    };
    const pfphandler = async (userpfp_choice: string) => {
        await fetch(`${API_URL}/api/pfp_setter`, {
            method: "post", // (or POST, whatever you route it as)
            headers: { "Content-Type": "application/json" },
            credentials: "include", // <--- CRITICAL! This sends the session cookie
            body: JSON.stringify({ pfp: userpfp_choice }), // No ID needed here
        }).then(async res => {
            if (res.ok) {
                const data = await res.json();

                setUser({ ...user, avatar_url: data.pfp });
                setUserPfp(data.pfp);
            } else {
                setUserPfp("pfp_1");
            }
        });
    };

    useEffect(() => {
        console.log("🔥 USER STATE UPDATED:", user.avatar_url);
    }, [user]);
    return (
        <section className="profile">
            <div className="profile-container">
                <div className="pfp">
                    <div className="pfp-container">
                        <img
                            onClick={hiddenHandler}
                            className="profile-img"
                            src={`pfp/${userpfp}.webp`}
                            alt={`${user.username}_pfp`}
                        />
                        <span className="pfp-overlay" aria-hidden="true">
                            ✎
                        </span>
                    </div>

                    <p>PlayerID: {user.id}</p>
                    <span className="divider-purple"></span>

                    <form className="password-reset">
                        <input type="password" name="old-password" id="old-password" placeholder="old Password" />
                        <input type="password" name="Confirm-password" id="new-password" placeholder="New Password" />
                        <input
                            type="password"
                            name="old-password"
                            id="Confirm-password"
                            placeholder="Confirm Password"
                        />
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
            {!ishidden && (
                <div className="pfp-image-list">
                    <div className="list-container">
                        {PFP_OPTIONS.map((n, i) => (
                            <img
                                className="pfp-images"
                                onClick={() => {
                                    pfphandler(n);
                                    hiddenHandler();
                                }}
                                src={`pfp/${n}.webp`}
                                key={i}
                                alt={`pfp/${n}`}
                            />
                        ))}
                    </div>
                    <button onClick={hiddenHandler}>Back</button>
                </div>
            )}
            <div onClick={hiddenHandler} className={`back-cover ${ishidden ? `hidden` : "active"}`}></div>
        </section>
    );
}
