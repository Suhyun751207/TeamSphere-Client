import { Link } from "react-router-dom";

function Dashboard() {
    return (
        <div>
            <Link to="/auth/login">Login</Link><br />
            <Link to="/user/rooms">Rooms</Link><br />
            <Link to="/user/profile">Profile</Link><br />
            <h1>Dashboard</h1>
        </div>
    )
}

export default Dashboard;
