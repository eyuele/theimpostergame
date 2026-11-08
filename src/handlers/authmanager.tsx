import { useState } from "react";
import "./authmanager.css";

export default function AuthManager() {
    const [isreghidden, setregHidden] = useState(true);
    const [isloginhidden, setloginHidden] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "register">("login");

    return (
        <div className="login-container">
            <div className="logo"></div>

            <div className="auth-choice">
                <button
                    className={authMode === "login" ? "active" : ""}
                    onClick={() => {
                        setAuthMode("login");
                        setregHidden(true);
                        setloginHidden(false);
                    }}
                >
                    Login
                </button>
                <button
                    className={authMode === "register" ? "active" : ""}
                    onClick={() => {
                        setAuthMode("register");
                        setregHidden(false);
                        setloginHidden(true);
                    }}
                >
                    Register
                </button>
            </div>
            {!isreghidden && (
                <div className="register-auth">
                    <form action="">
                        <label htmlFor="regusername">UserName</label>
                        <input type="text" name="" id="regusername" />
                        <label htmlFor="regpassword">Password</label>
                        <input type="password" name="" id="regpassword" />
                        <label htmlFor="regpasskey">Pass Key</label>
                        <input type="text" maxLength={10} name="" id="regpasskey" />

                        <input type="button" value="Register" />
                    </form>
                </div>
            )}
            {!isloginhidden && (
                <div className="login-auth">
                    <form action="">
                        <label htmlFor="loginusername">UserName</label>
                        <input type="text" name="" id="loginusername" />
                        <label htmlFor="password">Password</label>
                        <input type="loginpassword" name="" id="loginpassword" />

                        <input type="button" value="Login" />
                    </form>
                </div>
            )}
            <p></p>
        </div>
    );
}
