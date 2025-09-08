// Room related interfaces

export interface Room {
    id: number;
    roomId: number;
    userId: number;
    lastMessageId: number | null;
    createdAt: string;
    lastMessageTime?: string;
    room?: {
        title?: string;
        lastMessageId?: number | null;
    };
}

export interface WorkspaceRoom {
    id: number;
    roomId: number;
    userId: number;
    lastMessageId: number | null;
    room: [{
        title: string;
        lastMessageId: number | null;
    }];
    createdAt: string;
    lastMessageTime?: string;
    title?: string;
}
