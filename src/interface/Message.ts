// Message related interfaces

export interface Message {
    id: number;
    roomId: number;
    userId: number;
    content: string;
    messageType?: "TEXT" | "IMAGE" | "FILE";
    type?: string;
    imagePath?: string | null;
    isEdited: boolean;
    isDeleted?: boolean;
    isValid?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MessageWithProfile extends Message {
    userName?: string;
}
