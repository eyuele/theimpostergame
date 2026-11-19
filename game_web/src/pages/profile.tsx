import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useUser } from "./authcontext";
import "./styles/profile.css";

interface PassChange {
    old_pass: String;
    new_pass: String;
    confirm_pass: String;
}

export default function Profile() {
    const { user, setUser } = useUser();
    const API_URL = import.meta.env.VITE_API_URL || "";
    const [ishidden, setishidden] = useState(true);
    const [isloading, setisloading] = useState(false);
    const [userpfp, setUserPfp] = useState(`${user.avatar_url}`);
    const PFP_OPTIONS = Array.from({ length: 52 }, (_, index) => `pfp_${index + 1}`);
    const [isvalid, setisvalid] = useState(false);
    const [message, setMessage] = useState("");

    const [user_pass, setUserpass] = useState<PassChange>({ old_pass: "", new_pass: "", confirm_pass: "" });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserpass(prev => ({ ...prev, [name]: value }));
    };

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

    const verify_pass = () => {
        if (user_pass.new_pass !== user_pass.confirm_pass) {
            setMessage("please enter similar password");
            setisvalid(false);
        } else if (user_pass.new_pass === "" || user_pass.confirm_pass === "") {
            setMessage("please enter a valid password");
            setisvalid(false);
        } else {
            setMessage("");
            setisvalid(true);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setisloading(true);

        // handle the api
        try {
            let res = await fetch(`${API_URL}/api/pass_change`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(user_pass),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            setMessage("Password updated successfully!");
        } catch (err: any) {
            console.error(err);
            if (err instanceof Error) {
                const isBadRequest = err.message.includes("400");

                setMessage(
                    isBadRequest
                        ? "please check your old password is correct, and chekc if your new password is similar with the old one and try again."
                        : "internal server error",
                );
            } else {
                setMessage("An unknown error occurred.");
            }
        } finally {
            setisloading(false);
        }
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

                    <form onSubmit={handleSubmit} className="password-reset">
                        <input
                            type="password"
                            onChange={handleChange}
                            value={`${user_pass.old_pass}`}
                            name="old_pass"
                            minLength={8}
                            maxLength={16}
                            id="old-password"
                            placeholder="old Password"
                        />
                        <input
                            type="password"
                            onChange={handleChange}
                            value={`${user_pass.new_pass}`}
                            name="new_pass"
                            minLength={8}
                            maxLength={16}
                            id="new-password"
                            placeholder="New Password"
                        />
                        <input
                            type="password"
                            onChange={handleChange}
                            value={`${user_pass.confirm_pass}`}
                            name="confirm_pass"
                            minLength={8}
                            maxLength={16}
                            id="Confirm-password"
                            placeholder="Confirm Password"
                        />
                        <p>{message}</p>
                        <button onClick={verify_pass} type={`${isvalid ? "submit" : "button"}`}>
                            {!isloading ? "Submit" : "Loading..."}
                        </button>
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
