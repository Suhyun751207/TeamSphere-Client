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
  user_disconnected: (callback: (data: { userId: number; timestamp: Date }) => void) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, serverPath = 'http://localhost:8080' } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Helper function to get token from cookies
  const getTokenFromCookie = (): string | null => {
    const cookies = document.cookie.split(';');
    console.log('🍪 All cookies:', document.cookie);
    console.log('🔍 Parsed cookies:', cookies);
    
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      console.log(`🏷️ Cookie: ${name} = ${value ? 'HAS_VALUE' : 'EMPTY'}`);
      
      // Try different possible cookie names
      if (name === 'token' || name === 'authToken' || name === 'accessToken' || name === 'accesstoken' || name === 'jwt') {
        console.log(`✅ Found auth token in cookie: ${name}`);
        return decodeURIComponent(value);
      }
    }
    console.log('❌ No auth token found in any cookie');
    return null;
  };

  // Initialize socket connection
  const connect = () => {
    console.log('🔄 Socket.IO connect() called');
    
    if (socketRef.current?.connected) {
      console.log('⚠️ Socket already connected, skipping');
      return;
    }

    const token = getTokenFromCookie();
    console.log('🍪 Token from cookie:', token ? 'EXISTS' : 'NOT FOUND');
    console.log('🔗 Attempting to connect to:', serverPath);
    
    if (!token) {
      console.error('❌ No authentication token found in cookies');
      setConnectionError('No authentication token found in cookies');
      return;
    }

    try {
      console.log('🚀 Creating Socket.IO instance...');
      socketRef.current = io(serverPath, {
        auth: {
          token: token
        },
        autoConnect: false
      });
      console.log('✅ Socket.IO instance created');

      // Connection event handlers
      socketRef.current.on('connect', () => {
        console.log('Socket.IO connected');
        setIsConnected(true);
        setConnectionError(null);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        console.error('Server path:', serverPath);
        console.error('Token exists:', !!token);
        setConnectionError(`Connection failed: ${error.message}`);
        setIsConnected(false);
      });

      // Connect to server
      console.log('🔌 Calling socket.connect()...');
      socketRef.current.connect();
      console.log('📡 socket.connect() called');
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
      console.log(`Joining room ${roomId}`);
    }
  };

  // Leave a room
  const leaveRoom = (roomId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', { roomId });
      console.log(`Leaving room ${roomId}`);
    }
  };

  // Send a message
  const sendMessage = (roomId: number, content: string, type: string = 'TEXT') => {
    if (socketRef.current?.connected && content.trim()) {
      socketRef.current.emit('send_message', { roomId, content: content.trim(), type });
      console.log(`Sending message to room ${roomId}:`, content);
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
    console.log('🎯 useSocket useEffect triggered, autoConnect:', autoConnect);
    if (autoConnect) {
      console.log('🔄 Auto-connecting...');
      connect();
    } else {
      console.log('⏸️ Auto-connect disabled');
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 useSocket cleanup');
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
    onUserDisconnected,
    onRoomUpdated,
    
    // Direct socket access (use carefully)
    socket: socketRef.current
  };
};

export default useSocket;
