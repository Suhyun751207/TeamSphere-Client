import api from "../Api";

async function Getdashboard() {
    return await api.get(`/v1/dashboard`);
}

const DashboardService = {
    Getdashboard
}


export default DashboardService;
