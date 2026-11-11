import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import "./authmanager.css";

interface User {
    username: string;
    password: string;
    pass_key?: string;
}

export default function AuthManager() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [userForm, setUserform] = useState<User>({
        username: "",
        password: "",
        pass_key: "",
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserform(prev => ({ ...prev, [name]: value }));
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const endpoint = isLogin ? "login" : "register";
        try {
            const response = await fetch(`/api/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(userForm),
            });

            const textData = await response.text();
            let data;
            try {
                data = JSON.parse(textData);
            } catch {
                data = { message: textData };
            }

            if (!response.ok) {
                // 👇 THIS WILL NOW SHOW THE REAL RUST ERROR
                throw new Error(data.message || `Error ${response.status}`);
            }

            setMessage(isLogin ? `wellcome back ${userForm.username}` : "registerd successfully");
            if (response.ok) navigate("/");
            else setError("Wrong username or password");
        } catch (e: any) {
            console.error(`Error : ${e}`);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="logo"></div>
            {/* this is the auth for login */}
            <div className="auth-container">
                {isLogin && (
                    <div className="auth">
                        <h2>Welcome Back</h2>
                        <p>Enter your credentials to join the investigation</p>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="username"
                                value={userForm.username}
                                onChange={handleChange}
                                required
                                placeholder="Username"
                                id="loginusername"
                            />
                            <input
                                type="password"
                                name="password"
                                value={userForm.password}
                                onChange={handleChange}
                                required
                                placeholder="Password"
                                id="loginpassword"
                            />

                            <button type="submit" disabled={loading}>
                                {!loading ? "Login" : "Loading..."}
                            </button>
                        </form>
                        <p>{error === "" ? message : error}</p>
                        <div className="divider">
                            <span></span>
                            <p>or</p>
                            <span></span>
                        </div>
                        <div className="auth-choice">
                            <button
                                onClick={() => {
                                    setIsLogin(false);
                                    setError("");
                                }}
                            >
                                Create an Account
                            </button>
                        </div>
                    </div>
                )}
                {/* this is the auth for register */}
                {!isLogin && (
                    <div className="auth">
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                name="username"
                                onChange={handleChange}
                                value={userForm.username}
                                placeholder="Username"
                                required
                                id="regusername"
                            />
                            <input
                                type="password"
                                name="password"
                                onChange={handleChange}
                                value={userForm.password}
                                required
                                placeholder="Password"
                                id="regpassword"
                            />
                            <label htmlFor="regpasskey">Pass Key</label>
                            <input
                                type="text"
                                maxLength={10}
                                name="pass_key"
                                value={userForm.pass_key}
                                required
                                placeholder="PassKey"
                                onChange={handleChange}
                                id="regpasskey"
                            />

                            <input type="submit" disabled={loading} value="Register" />
                        </form>
                        <p>{error === "" ? message : error}</p>

                        <div className="divider">
                            <span></span>
                            <p>or</p>
                            <span></span>
                        </div>
                        <div className="auth-choice">
                            <button
                                onClick={() => {
                                    setIsLogin(true);
                                    setError("");
                                }}
                            >
                                Login
                            </button>{" "}
                        </div>
                    </div>
                )}

                <div className="bottom-text">
                    <p>SAME FRIENDS</p>
                    {"\u2726"}
                    <p>DIFFERENT LIES</p>
                    {"\u2726"}
                    <p>GREATER FUN</p>
                </div>
            </div>
        </div>
    );
}
