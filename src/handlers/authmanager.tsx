import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import "./authmanager.css";

interface User {
    username: string;
    password: string;
    pass_key?: string;
}

export default function Auth() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [userForm, setUserform] = useState<User>({
        username: "",
        password: "",
        pass_key: "",
    });

    const [welcomeText, setWelcomeText] = useState("");

    const welcomeMessages = {
        login: [
            "Welcome back, detective. The lies are already piling up.",
            "Enter your credentials to rejoin the investigation.",
            "Step back into the shadows. Your crew is waiting.",
            "Prove you're the real deal. No impostors past this point.",
            "The game is afoot. Log in to find the traitor.",
            "Ah, you’re back. We were just about to vote you out.",
            "Look who survived the night. Ready to point fingers again?",
            "Welcome back. Try not to get eliminated in the first round this time.",
            "The board is reset, but the paranoia remains. Step inside.",
            "We saved your seat. But honestly? We’re still not sure we trust you.",
            "Your alibi is required. Enter your details.",
            "The lie detector is warmed up and waiting for you.",
            "Back to the scene of the crime, I see.",
            "Let’s see if your story checks out today. Log in.",
            "I was just telling everyone how suspicious you looked. Perfect timing.",
            "The shadows missed you. Let’s get back to the deception.",
            "We kept your alibi warm. Log in before someone changes the story.",
            "You again? Good. We needed a prime suspect.",
            "Enter your credentials. I promise I won't tell the others you were late.",
            "The investigation stalls without you. Step into the light—or don't, it's a bit bright.",
            "Ah, the prodigal liar returns. We've missed your chaos.",
            "Credentials, please. And try to be convincing this time.",
            "Ready to test your poker face again? We’re waiting.",
            "Look who decided to grace us with their presence. The crew is getting restless.",
            "Welcome back, detective. The lies are already piling up.",
        ],
        register: [
            "New recruit? Create your identity and trust no one.",
            "Join the investigation. Just don't be the one lying.",
            "Get your detective badge. The mystery awaits.",
            "Time to go undercover. Register to join the crew.",
            "Create an account and prepare for the ultimate test of trust.",
            "A new face. Are you a brilliant detective, or the best liar we’ve ever seen? Let’s find out.",
            "Ready to step into the shadows? Create your identity, but don't get too attached to it.",
            "Another recruit. We trust you... for now. Sign up.",
            "Enter your details. I promise this information is completely safe... probably.",
            "Creating an account? Excellent. The first lie is always the hardest.",
            "Welcome to the agency. Leave your trust at the door and pick up a magnifying glass.",
            "So, you want to play detective? Let's see if you can spot the fake.",
            "New blood. The game needed fresh victims—I mean, players. Sign up here.",
            "Before we let you in, we need a name. Make it a good one, you'll be using it a lot.",
            "Register now. The more the merrier, and the harder it is to find the truth.",
            "New identity, same paranoia. Let’s create a legend.",
            "Are you ready to be blamed for everything? Because it will happen.",
            "Sign up. The only thing you have to lose is your reputation.",
            "A fresh start. A new liar enters the game.",
            "Enter the arena. Leave your innocence at the door.",
            "We need someone to blame. You'll do nicely. Create an account.",
            "I'll keep your secrets if you keep mine. Let's get you registered.",
            "Step into the interrogation room. Let's get you set up.",
            "Don't worry, we're all friends here. (That's what an impostor would say). Register.",
            "Time to go undercover. Pick a name that doesn't give you away.",
        ],
    };

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
    const randomWelcomeHandler = useMemo(() => {
        const messages = isLogin ? welcomeMessages.login : welcomeMessages.register;
        const randomemessage = messages[Math.floor(Math.random() * messages.length)];

        setWelcomeText(randomemessage);
        console.log(welcomeText);
    }, [isLogin]);

    return (
        <div className="login-container">
            <div className="logo"></div>
            {/* this is the auth for login */}
            <div className="auth-container">
                {isLogin && (
                    <div className="auth">
                        <h2>Welcome Back</h2>
                        <p>{welcomeText}</p>
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
                                    randomWelcomeHandler;
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
                        <h2>WELCOME!</h2>
                        <p>{welcomeText}</p>
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

                            <button type="submit" disabled={loading}>
                                Register
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
                                    setIsLogin(true);
                                    setError("");
                                    randomWelcomeHandler;
                                }}
                            >
                                Login
                            </button>
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
