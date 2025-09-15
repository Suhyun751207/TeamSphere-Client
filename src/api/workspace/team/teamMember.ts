import api from "../../Api";
import { TeamCreateRequest, TeamMemberCreateRequest, WorkspaceRole } from "../../../interface/Workspace";

async function createTeam(workspaceId: number, teamCreateRequest: TeamCreateRequest) {
    return await api.post(`/v1/workspace/${workspaceId}/teams`, teamCreateRequest);
}

async function getTeamMembers(workspaceId: number, teamId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/teams/${teamId}/member`);
}

async function addTeamMember(workspaceId: number, teamId: number, memberData: TeamMemberCreateRequest) {
    return await api.post(`/v1/workspace/${workspaceId}/teams/${teamId}/member`, memberData);
}

async function removeTeamMember(workspaceId: number, teamId: number, memberId: number) {
    return await api.delete(`/v1/workspace/${workspaceId}/teams/${teamId}/member/${memberId}`);
}

async function getWorkspaceMe(workspaceId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/members/me`);
}

async function updateTeamMember(workspaceId: number, teamId: number, memberId: number, role: WorkspaceRole) {
    return await api.patch(`/v1/workspace/${workspaceId}/teams/${teamId}/member/${memberId}`, { role });
}

const TeamMemberAPI = {
    createTeam,
    getTeamMembers,
    addTeamMember,
    removeTeamMember,
    getWorkspaceMe,
    updateTeamMember
};

export default TeamMemberAPI;