import { 
  CreateRoomRequest, 
  SendMessageRequest, 
  DMRoomsResponse, 
  DMRoomDetailResponse, 
  CreateRoomResponse, 
  SendMessageResponse 
} from "../../interface/Message";
import api from "../Api";

// DM 채팅방 목록 조회
async function getDMRooms(): Promise<DMRoomsResponse> {
  const response = await api.get("/user/message");
  return response.data;
}

// DM 채팅방 상세 조회 (메시지 목록 포함)
async function getDMRoomDetail(roomId: string, page: number = 1, limit: number = 50): Promise<DMRoomDetailResponse> {
  const response = await api.get(`/user/message/${roomId}?page=${page}&limit=${limit}`);
  return response.data;
}

// DM 채팅방 생성
async function createDMRoom(data: CreateRoomRequest): Promise<CreateRoomResponse> {
  const response = await api.post("/user/message/room", data);
  return response.data;
}

// 메시지 전송
async function sendMessage(roomId: string, data: SendMessageRequest): Promise<SendMessageResponse> {
  const response = await api.post(`/user/message/${roomId}/message`, data);
  return response.data;
}

async function markAsRead(roomId: string, messageId: string) {
    return await api.post(`/v1/user/message/${roomId}/read`, { messageId })
}

const MessageServer = {
  getDMRooms,
  getDMRoomDetail,
  createDMRoom,
  sendMessage,
  markAsRead
};

export default MessageServer;
