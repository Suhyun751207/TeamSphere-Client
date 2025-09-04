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
    name: string;
    description?: string;
}
