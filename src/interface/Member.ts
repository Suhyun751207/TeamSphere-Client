// Member related interfaces

export interface Member {
    id: number;
    roomId: number;
    userId: number;
    lastMessageId: number | null;
    createdAt: string;
    userName?: string;
    isOnline?: boolean;
}

export interface MemberWithProfile extends Member {
    name?: string;
    imagePath?: string;
    phone?: string;
    subscriptionState?: string;
}
