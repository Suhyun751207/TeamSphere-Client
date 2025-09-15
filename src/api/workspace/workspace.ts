import api from "../Api";
import { WorkspaceCreateRequest, RoomCreateRequest, MessageCreateRequest, MessageUpdateRequest, WorkspaceMemberCreateRequest, ActivityLogsCreate } from "../../interface/Workspace";

// 워크스페이스 목록 조회
async function WorkspaceList(workspaceId: number) {
    return await api.get(`/workspace/${workspaceId}/dashboard`);
}

// 워크스페이스 생성
async function WorkspaceCreate(data: WorkspaceCreateRequest) {
    return await api.post("/workspace", data);
}

// 워크스페이스 상세 조회
async function WorkspaceDetail(workspaceId: number) {
    return await api.get(`/workspace/${workspaceId}`);
}

// 워크스페이스 수정
async function WorkspaceUpdate(workspaceId: number, data: WorkspaceCreateRequest) {
    return await api.patch(`/workspace/${workspaceId}`, data);
}

// 워크스페이스 메시지 룸 목록 조회
async function WorkspaceRoomList(workspaceId: number) {
    return await api.get(`/workspace/${workspaceId}/message`);
}

// 워크스페이스 메시지 룸 생성
async function WorkspaceRoomCreate(workspaceId: number, data: RoomCreateRequest) {
    return await api.post(`/workspace/${workspaceId}/message`, data);
}

// 워크스페이스 룸 멤버 목록 조회
async function WorkspaceMemberList(workspaceId: number, roomId: number) {
    return await api.get(`/workspace/${workspaceId}/message/${roomId}`);
}


// 워크스페이스 룸 메시지 목록 조회
async function WorkspaceMessageList(workspaceId: number, roomId: number) {
    return await api.get(`/workspace/${workspaceId}/message/${roomId}/message`);
}

// 워크스페이스 룸에 메시지 전송
async function WorkspaceMessageCreate(workspaceId: number, roomId: number, data: MessageCreateRequest) {
    return await api.post(`/workspace/${workspaceId}/message/${roomId}/message`, data);
}

// 워크스페이스 룸 마지막 메시지 업데이트
async function WorkspaceRoomLastMessageUpdate(workspaceId: number, roomId: number, messageId: number) {
    return await api.patch(`/workspace/${workspaceId}/message/${roomId}/${messageId}`);
}

async function WorkspaceRoomMemberAdd(workspaceId: number, roomId: number, userId: number) {
    return await api.post(`/workspace/${workspaceId}/message/${roomId}/${userId}/add`);
}

// 워크스페이스 멤버 추가
async function WorkspaceMemberAdd(workspaceId: number, data: WorkspaceMemberCreateRequest) {
    return await api.post(`/workspace/${workspaceId}/members`, data);
}


//워크스페이스 활동 로그 조회
async function WorkspaceActivityLogList(workspaceId: number) {
    return await api.get(`/workspace/${workspaceId}/activityLog`);
}

//워크스페이스 활동 로그 생성
async function WorkspaceActivityLogCreate(workspaceId: number, data: ActivityLogsCreate) {
    return await api.post(`/v1/workspace/${workspaceId}/activityLog`, data);
}

//워크스페이스 룸 정보 조회
async function WorkspaceRoomInfo(workspaceId: number, roomId: number) {
    return await api.get(`/v1/workspace/${workspaceId}/message/${roomId}/info`);
}

//워크스페이스 멤버 업데이트
async function WorkspaceMemberUpdate(workspaceId: number, data: WorkspaceMemberCreateRequest) {
    return await api.patch(`/v1/workspace/${workspaceId}/members`, data);
}

const WorkspaceServer = {
    WorkspaceList,
    WorkspaceCreate,
    WorkspaceDetail,
    WorkspaceUpdate,
    WorkspaceRoomList,
    WorkspaceRoomCreate,
    WorkspaceMemberList,
    WorkspaceMessageList,
    WorkspaceMessageCreate,
    WorkspaceRoomLastMessageUpdate,
    WorkspaceRoomMemberAdd,
    WorkspaceMemberAdd,
    WorkspaceMemberUpdate,
    WorkspaceActivityLogList,
    WorkspaceActivityLogCreate,
    WorkspaceRoomInfo
};

export default WorkspaceServer;
