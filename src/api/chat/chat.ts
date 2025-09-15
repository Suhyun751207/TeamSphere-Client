import api from "../Api";

async function ChatMessage(message: string) {
    return await api.post(`/v1/ai/chat`, {
        message
    });
}

const ChatService = {
    ChatMessage
}


export default ChatService;
