import api from "../Api";

async function Getdashboard() {
    return await api.get(`/dashboard`);
}

const DashboardService = {
    Getdashboard
}


export default DashboardService;
