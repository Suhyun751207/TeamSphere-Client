import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean;
  serverPath?: string;
}

interface MessageData {
  id: number;
  roomId: number;
  userId: number;
  type: string;
  content: string;
  imagePath: string | null;
  isEdited: boolean;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocketEvents {
  // Outgoing events
  join_room: (data: { roomId: number }) => void;
  leave_room: (data: { roomId: number }) => void;
  send_message: (data: { roomId: number; content: string; type?: string }) => void;
  typing_start: (data: { roomId: number }) => void;
  typing_stop: (data: { roomId: number }) => void;
  
  // Incoming events
  new_message: (callback: (message: MessageData) => void) => void;
  message_error: (callback: (error: { error: string; details?: string }) => void) => void;
  user_joined: (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => void;
  user_left: (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => void;
  user_typing: (callback: (data: { userId: number; roomId: number; isTyping: boolean }) => void) => void;
  user_online: (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => void;
  user_offline: (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => void;
  user_disconnected: (callback: (data: { userId: number; timestamp: Date }) => void) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, serverPath = 'https://teamsphere-server-production.up.railway.app/' } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Helper function to get token from cookies
  const getTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      
      // Try different possible cookie names
      if (name === 'token' || name === 'authToken' || name === 'accessToken' || name === 'accesstoken' || name === 'jwt') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  // Initialize socket connection
  const connect = () => {
    
    if (socketRef.current?.connected) {
      return;
    }

    const token = getTokenFromCookie();
    
    if (!token) {
      console.error('❌ No authentication token found in cookies');
      setConnectionError('No authentication token found in cookies');
      return;
    }

    try {
      socketRef.current = io(serverPath, {
        auth: {
          token: token
        },
        autoConnect: false
      });

      // Connection event handlers
      socketRef.current.on('connect', () => {
        setIsConnected(true);
        setConnectionError(null);
      });

      socketRef.current.on('disconnect', (reason) => {
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Server path:', serverPath);
        console.error('Token exists:', !!token);
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnected(false);
      });

      // Connect to server
      socketRef.current.connect();
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setConnectionError('Failed to initialize socket connection');
    }
  };

  // Disconnect socket
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  // Join a room
  const joinRoom = (roomId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', { roomId });
    }
  };

  // Leave a room
  const leaveRoom = (roomId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', { roomId });
    }
  };

  // Send a message
  const sendMessage = (roomId: number, content: string, type: string = 'TEXT') => {
    if (socketRef.current?.connected && content.trim()) {
      socketRef.current.emit('send_message', { roomId, content: content.trim(), type });
    }
  };

  // Typing indicators
  const startTyping = (roomId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_start', { roomId });
    }
  };

  const stopTyping = (roomId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing_stop', { roomId });
    }
  };

  // Event listeners
  const onNewMessage = (callback: (message: MessageData) => void) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', callback);
      return () => socketRef.current?.off('new_message', callback);
    }
    return () => {};
  };

  const onMessageError = (callback: (error: { error: string; details?: string }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('message_error', callback);
      return () => socketRef.current?.off('message_error', callback);
    }
    return () => {};
  };

  const onUserJoined = (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_joined', callback);
      return () => socketRef.current?.off('user_joined', callback);
    }
    return () => {};
  };

  const onUserLeft = (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_left', callback);
      return () => socketRef.current?.off('user_left', callback);
    }
    return () => {};
  };

  const onUserTyping = (callback: (data: { userId: number; roomId: number; isTyping: boolean }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_typing', callback);
      return () => socketRef.current?.off('user_typing', callback);
    }
    return () => {};
  };

  const onUserOnline = (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_online', callback);
      return () => socketRef.current?.off('user_online', callback);
    }
    return () => {};
  };

  const onUserOffline = (callback: (data: { userId: number; roomId: number; timestamp: Date }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_offline', callback);
      return () => socketRef.current?.off('user_offline', callback);
    }
    return () => {};
  };

  const onUserDisconnected = (callback: (data: { userId: number; timestamp: Date }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('user_disconnected', callback);
      return () => socketRef.current?.off('user_disconnected', callback);
    }
    return () => {};
  };

  const onRoomUpdated = (callback: (data: { roomId: number; lastMessageId: number; lastMessage: any; timestamp: Date }) => void) => {
    if (socketRef.current) {
      socketRef.current.on('room_updated', callback);
      return () => socketRef.current?.off('room_updated', callback);
    }
    return () => {};
  };

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Reconnect when token changes
  useEffect(() => {
    const token = getTokenFromCookie();
    if (token && !socketRef.current?.connected && autoConnect) {
      connect();
    }
  }, []);

  return {
    // Connection state
    isConnected,
    connectionError,
    
    // Connection methods
    connect,
    disconnect,
    
    // Room methods
    joinRoom,
    leaveRoom,
    
    // Message methods
    sendMessage,
    
    // Typing methods
    startTyping,
    stopTyping,
    
    // Event listeners
    onNewMessage,
    onMessageError,
    onUserJoined,
    onUserLeft,
    onUserTyping,
    onUserOnline,
    onUserOffline,
    onUserDisconnected,
    onRoomUpdated,
    
    // Direct socket access (use carefully)
    socket: socketRef.current
  };
};

export default useSocket;
