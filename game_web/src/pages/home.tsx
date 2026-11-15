import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import "./styles/home.css";

export default function Home() {
    const titles = {
        civilian: ["Sherlock"],
        imposter: ["Wolf in Sheep's Clothing"],
        tragic: ["first to go out"],
        others: ["ranked number 1"],
    };
    const [textMainValue, setMainTextValue] = useState("");
    const [TextSubValue, setSubTextValue] = useState("");
    const heroText = {
        main: [
            "Your Next Assignment",
            "The Interrogation Begins",
            "Ready to Lie?",
            "Time to Point Fingers",
            "Uncover the Truth",
            "Assemble Your Suspects",
        ],
        sub: [
            "The crew is assembled, but the paranoia is already setting in. Pick your game mode, create a private lobby, or infiltrate an ongoing investigation. Just remember: someone in this room is lying, and it's probably your best friend.",
            "The board is set and the roles are waiting. Take a seat, choose your game mode, and prepare to defend your innocence while pointing fingers at everyone else. Trust no one, because one of them is already planning your downfall.",
            "Gather your most suspicious friends. Pick a game mode, secure your private channel, and get ready to argue about who looked at who funny. The truth is out there... or maybe it's just a really good bluff.",
            "The agency is waiting for your orders. Head to the deployment zone to customize your match and invite your crew. But keep your eyes peeled—the Impostor is already picking their first target.",
            "Choose your game mode, assemble your crew, and start the chaos. The only thing harder than finding the Impostor is convincing everyone that it isn't you.",
        ],
    };

    useEffect(() => {
        const heroTextMainHandler = () => {
            const value = heroText.main[Math.floor(Math.random() * heroText.main.length)];
            setMainTextValue(value);
        };
        const heroTextSubHandler = () => {
            const value = heroText.sub[Math.floor(Math.random() * heroText.sub.length)];
            setSubTextValue(value);
        };
        heroTextMainHandler();
        heroTextSubHandler();
    }, []);

    return (
        <div className="main-container">
            <section>
                <div className="current-container">
                    <div className="card-container"></div>
                </div>
            </section>
            <section className="play-btn-container">
                <div className="card-container">
                    <div className="card">
                        <div>
                            <h2>{textMainValue}</h2>
                            <p>{TextSubValue} </p>
                        </div>
                        <NavLink className={"nav-li"} to={"/play"}>
                            Join The Investigation
                        </NavLink>
                    </div>
                </div>
            </section>

            <section className="title-list">
                <div className="card-container">
                    {titles.civilian.map(n => (
                        <div className="card civilian" key={n}>
                            {n}
                        </div>
                    ))}
                    <span className="divider-purple"></span>
                    {titles.imposter.map(n => (
                        <div className="card imposter " key={n}>
                            {n}
                        </div>
                    ))}
                    <span className="divider-purple"></span>
                    {titles.tragic.map(n => (
                        <div className="card tragic" key={n}>
                            {n}
                        </div>
                    ))}
                    <span className="divider-purple"></span>
                    {titles.others.map(n => (
                        <div className="card others" key={n}>
                            {n}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
