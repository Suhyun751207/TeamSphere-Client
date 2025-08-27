import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/user/Profile";
import Messages from "../pages/user/Messages";

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/auth">
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                </Route>
                <Route path="/user">
                    <Route path="profile" element={<Profile />} />
                    <Route path="messages" element={<Messages />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}