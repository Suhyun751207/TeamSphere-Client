import api from "../Api";
import { TeamCreateRequest } from "../../interface/Workspace";


// 워크스페이스 팀 목록 조회
async function getWorkspaceTeams(workspaceId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/teams`);
}

// 워크스페이스 팀 생성
async function createWorkspaceTeam(workspaceId: number, data: TeamCreateRequest) {
    return await api.post(`/v1/workspace/${workspaceId}/teams`, data);
}

// 워크스페이스 멤버 목록 조회
async function getWorkspaceMembers(workspaceId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/members`);
}

// 워크스페이스 활동 로그 조회
async function getWorkspaceActivityLogs(workspaceId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/activityLog`);
}

// 워크스페이스 출석 데이터 조회
async function getWorkspaceAttendance(workspaceId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/attendance`);
}

// 팀 작업 목록 조회
async function getTeamTasks(workspaceId: number, teamId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/teams/${teamId}/tasks`);
}



// 팀 대시보드 조회
async function getTeamDashboard(workspaceId: number, teamId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/teams/${teamId}/dashboard`);
}






const TeamAPI = {
    getWorkspaceTeams,
    createWorkspaceTeam,
    getWorkspaceMembers,
    getWorkspaceActivityLogs,
    getWorkspaceAttendance,
    getTeamTasks,
    getTeamDashboard
};

export default TeamAPI;
