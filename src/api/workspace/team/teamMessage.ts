import api from "../../Api";
import { RoomCreateRequest, MessageCreateRequest } from "../../../interface/Workspace";

// 팀 메시지 룸 목록 조회
async function TeamRoomList(workspaceId: number, teamId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/Teams/${teamId}/message`);
}

// 팀 메시지 룸 생성
async function TeamRoomCreate(workspaceId: number, teamId: number, data: RoomCreateRequest) {
    return await api.post(`/v1/workspace/${workspaceId}/Teams/${teamId}/message`, data);
}

// 팀 룸 멤버 목록 조회
async function TeamMemberList(workspaceId: number, teamId: number, roomId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}`);
}

// 팀 룸 정보 조회
async function TeamRoomInfo(workspaceId: number, teamId: number, roomId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/info`);
}

// 팀 룸 멤버 조회
async function TeamRoomMembers(workspaceId: number, teamId: number, roomId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/members`);
}

// 팀 룸 메시지 목록 조회
async function TeamMessageList(workspaceId: number, teamId: number, roomId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/message`);
}

// 팀 룸에 메시지 전송
async function TeamMessageCreate(workspaceId: number, teamId: number, roomId: number, data: MessageCreateRequest) {
    return await api.post(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/message`, data);
}

// 팀 룸 메시지 수정
async function TeamMessageUpdate(workspaceId: number, teamId: number, roomId: number, messageId: number, data: { content: string }) {
    return await api.patch(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/message/${messageId}`, data);
}

// 팀 룸 메시지 삭제
async function TeamMessageDelete(workspaceId: number, teamId: number, roomId: number, messageId: number) {
    return await api.delete(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/message/${messageId}`);
}

// 팀 룸 마지막 메시지 업데이트
async function TeamRoomLastMessageUpdate(workspaceId: number, teamId: number, roomId: number, messageId: number) {
    return await api.patch(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/${messageId}`);
}

// 팀 룸에 멤버 추가
async function TeamRoomMemberAdd(workspaceId: number, teamId: number, roomId: number, userId: number) {
    return await api.post(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/${userId}/add`);
}

// 팀 룸에서 멤버 제거
async function TeamRoomMemberRemove(workspaceId: number, teamId: number, roomId: number, userId: number) {
    return await api.delete(`/v1/workspace/${workspaceId}/Teams/${teamId}/message/${roomId}/${userId}/remove`);
}

const TeamMessageServer = {
    TeamRoomList,
    TeamRoomCreate,
    TeamMemberList,
    TeamRoomInfo,
    TeamRoomMembers,
    TeamMessageList,
    TeamMessageCreate,
    TeamMessageUpdate,
    TeamMessageDelete,
    TeamRoomLastMessageUpdate,
    TeamRoomMemberAdd,
    TeamRoomMemberRemove
};

export default TeamMessageServer;
