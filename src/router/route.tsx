import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Dashboard from "../pages/Dashboard";
import Rooms from "../pages/user/room/Rooms";
import RoomDetail from "../pages/user/room/RoomDetail";
import Profile from "../pages/user/profile/Profile";
import Logout from "../pages/auth/Logout";

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/auth">
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                    <Route path="logout" element={<Logout />} />
                </Route>
                <Route path="/user">
                    <Route path="profile" element={<Profile />} />
                    <Route path="rooms" element={<Rooms />}>
                        <Route path=":roomId" element={<RoomDetail />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}