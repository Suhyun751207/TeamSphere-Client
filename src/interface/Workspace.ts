export interface Workspace {
    id: number;
    name: string;
    description: string;
    adminId: number;
    createdAt: string;
}

export interface Room {
    id: string;
    name: string;
    description?: string;
    type: string;
    createdAt: string;
}

export interface WorkspaceCreateRequest {
    name: string;
    description: string;
}

export interface RoomCreateRequest {
    title: string;
    description?: string;
}

export interface Message {
    id: number;
    roomId: number;
    userId: number;
    content: string;
    messageType: "TEXT" | "IMAGE" | "FILE";
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MessageCreateRequest {
    content: string;
    messageType?: "TEXT" | "IMAGE" | "FILE";
}

export interface MessageUpdateRequest {
    content: string;
}

export interface WorkspaceMemberCreateRequest {
    userId: number;
    role: "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";
}
