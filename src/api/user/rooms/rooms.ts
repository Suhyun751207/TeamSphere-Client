import api from "../../Api";

async function RoomsSelect() {
    return await api.get("/v1/user/rooms");
}

async function RoomsCreate() {
    return await api.post("/v1/user/rooms");
}

async function RoomMessageSelect(roomId: number) {
    return await api.get(`/v1/user/rooms/${roomId}`);
}

async function RoomMessageCreate(roomId: number, content: string) {
    return await api.post(`/v1/user/rooms/${roomId}/message`, {
        content,
    });
}

async function RoomMessageUpdate(roomId: number, messageId: number, content: string) {
    return await api.patch(`/v1/user/rooms/${roomId}/message/${messageId}`, {
        content,
    });
}

async function RoomUserInvite(roomId: number, userId: number) {
    return await api.post(`/v1/user/rooms/${roomId}/${userId}/invite`);
}

async function RoomLastMessageUpdate(roomId: number, messageId: number) {
    return await api.patch(`/v1/user/rooms/${roomId}/${messageId}`);
}

async function MessageSelect(roomId: number, messageId: number) {
    return await api.get(`/v1/user/rooms/${roomId}/message/${messageId}`);
}

async function RoomMembersSelect(roomId: number) {
    return await api.get(`/v1/user/rooms/${roomId}/members`);
}

const RoomsService = {
    RoomsSelect,
    RoomsCreate,
    RoomMessageSelect,
    RoomMessageCreate,
    RoomMessageUpdate,
    RoomUserInvite,
    RoomLastMessageUpdate,
    MessageSelect,
    RoomMembersSelect,
}

export default RoomsService;