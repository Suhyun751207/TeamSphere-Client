import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(token: string) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io('http://localhost:8080', {
      auth: {
        token
      },
      autoConnect: false
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-room', roomId);
    }
  }

  leaveRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', roomId);
    }
  }

  sendMessage(roomId: string, content: string, messageId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', {
        roomId,
        content,
        messageId
      });
    }
  }

  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('new-message', callback);
    }
  }

  offNewMessage(callback?: (message: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('new-message', callback);
      } else {
        this.socket.off('new-message');
      }
    }
  }

  onNewRoom(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('newRoom', callback);
    }
  }

  offNewRoom(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('newRoom', callback);
      } else {
        this.socket.off('newRoom');
      }
    }
  }

  onRoomUpdated(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('roomUpdated', callback);
    }
  }

  offRoomUpdated(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('roomUpdated', callback);
      } else {
        this.socket.off('roomUpdated');
      }
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
export default socketService;
