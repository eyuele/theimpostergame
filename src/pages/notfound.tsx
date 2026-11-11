import { NavLink } from "react-router";
import "./notfound.css";
export default function NotFound() {
    return (
        <div className="message404">
            <p>page not found: 404</p>
            <NavLink className="goback" to="/">
                Click here to go back to home
            </NavLink>
        </div>
    );
}
