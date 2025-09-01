import api from "../../Api";

async function RoomsSelect() {
    return await api.get("/user/rooms");
}

async function RoomsCreate() {
    return await api.post("/user/rooms");
}

async function RoomMessageSelect(roomId: number) {
    return await api.get(`/user/rooms/${roomId}`);
}

async function RoomMessageCreate(roomId: number, content: string) {
    return await api.post(`/user/rooms/${roomId}/message`, {
        content,
    });
}

async function RoomMessageUpdate(roomId: number, messageId: number, content: string) {
    return await api.patch(`/user/rooms/${roomId}/message/${messageId}`, {
        content,
    });
}

async function RoomUserInvite(roomId: number, userId: number) {
    return await api.post(`/user/rooms/${roomId}/${userId}/invite`);
}

async function RoomLastMessageUpdate(roomId: number, messageId: number) {
    return await api.patch(`/user/rooms/${roomId}/${messageId}`);
}

async function MessageSelect(roomId: number, messageId: number) {
    return await api.get(`/user/rooms/${roomId}/message/${messageId}`);
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
}

export default RoomsService;