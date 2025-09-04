import api from "../Api";

async function AttendanceGet() {
    return await api.get("/user/attendance");
}

async function AttendanceCreate() {
    return await api.post("/user/attendance");
}

const AttendanceService = {
    AttendanceGet,
    AttendanceCreate
};

export default AttendanceService;
