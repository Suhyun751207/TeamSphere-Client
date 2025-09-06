import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import Logout from "../pages/auth/Logout";
import Dashboard from "../pages/dashboard/Dashboard";
import Rooms from "../pages/user/room/Rooms";
import RoomDetail from "../pages/user/room/RoomDetail";
import Profile from "../pages/user/profile/Profile";
import Workspace from "../pages/workspace/workspace";
import WorkspaceRooms from "../pages/workspace/room/WorkspaceRooms";
import WorkspaceRoomDetail from "../pages/workspace/room/WorkspaceRoomDetail";

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />

                {/* Authentication Routes */}
                <Route path="/auth">
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                    <Route path="logout" element={<Logout />} />
                </Route>

                {/* Workspace Routes */}
                <Route path="/workspace">
                    <Route path=":workspaceId" element={<Workspace />} />
                    <Route path=":workspaceId/room" element={<WorkspaceRooms />}>
                        <Route path=":roomId" element={<WorkspaceRoomDetail />} />
                    </Route>
                </Route>

                {/* User Routes */}
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