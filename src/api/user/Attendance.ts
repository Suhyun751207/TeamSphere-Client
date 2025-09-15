import api from "../Api";

async function AttendanceGet() {
    return await api.get("/v1/user/attendance");
}

async function AttendanceCreate() {
    return await api.post("/v1/user/attendance");
}

const AttendanceService = {
    AttendanceGet,
    AttendanceCreate
};

export default AttendanceService;
