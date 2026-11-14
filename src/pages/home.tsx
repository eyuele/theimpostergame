import { NavLink } from "react-router";
import "./styles/home.css";

export default function Home() {
    const titles = {
        civilian: ["Sherlock"],
        imposter: ["Wolf in Sheep's Clothing"],
        tragic: ["first to go out"],
        others: ["ranked number 1"],
    };
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
                            <h2>some text</h2>
                            <p>some long text some long text some long tex </p>
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
