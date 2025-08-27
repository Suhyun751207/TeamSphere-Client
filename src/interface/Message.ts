export interface MongoRooms {
  _id?: string;
  type: 'dm' | 'workspace' | 'team';
  chatId: number | null;
  participants: number[];
  name?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: {
    messageId: string;
    content: string;
    createdAt: Date;
    userId: number;
  };
}

export interface MongoMessages {
  _id?: string;
  roomId: string;
  userId: number;
  content: string;
  messageType: 'text' | 'image' | 'file';
  replyToId?: string;
  createdAt: Date;
  updatedAt?: Date | null;
  isDeleted: boolean;
  isEdited: boolean;
}

export interface CreateRoomRequest {
  targetUserId: number;
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'image' | 'file';
  replyToId?: string;
}

export interface DMRoomsResponse {
  success: boolean;
  data: MongoRooms[];
}

export interface DMRoomDetailResponse {
  success: boolean;
  data: {
    room: MongoRooms;
    messages: MongoMessages[];
    pagination: {
      page: number;
      limit: number;
    };
  };
}

export interface CreateRoomResponse {
  success: boolean;
  data: MongoRooms;
  message?: string;
}

export interface SendMessageResponse {
  success: boolean;
  data: MongoMessages;
}
