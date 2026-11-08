import { Navigate, Route, Routes } from "react-router";
import "./App.css";
import RequireLogin from "./component/requirelogin";
import AuthManager from "./handlers/authmanager";
import Home from "./pages/home";
import Layout from "./pages/layout";
import NotFound from "./pages/notfound";

function App() {
    return (
        <Routes>
            <Route path="/authmanager" element={<AuthManager />} />
            <Route
                element={
                    <RequireLogin>
                        <Layout />
                    </RequireLogin>
                }
            >
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="/home" element={<Home />} />
            </Route>
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;
