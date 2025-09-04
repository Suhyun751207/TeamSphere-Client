import api from "../Api";
import { WorkspaceCreateRequest, RoomCreateRequest } from "../../interface/Workspace";

// 워크스페이스 목록 조회
async function WorkspaceList() {
    return await api.get("/workspace");
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

const WorkspaceServer = {
    WorkspaceList,
    WorkspaceCreate,
    WorkspaceDetail,
    WorkspaceUpdate,
    WorkspaceRoomList,
    WorkspaceRoomCreate
};

export default WorkspaceServer;
