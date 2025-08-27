import React, { useState, useEffect, useCallback, useRef } from 'react';
import MessageServer from '../../api/user/message';
import ProfileServer from '../../api/user/Profile';
import socketService from '../../config/socket';
import { MongoRooms, MongoMessages } from '../../interface/Message';
import './Messages.css';

// 쿠키에서 토큰 읽기 함수
const getCookieValue = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

// JWT 토큰에서 사용자 ID 추출 함수
const getCurrentUserId = (): number | null => {
  const token = getCookieValue('accesstoken');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

interface MessagesProps {}

const Messages: React.FC<MessagesProps> = () => {
  const [dmRooms, setDmRooms] = useState<MongoRooms[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<MongoRooms | null>(null);
  const [messages, setMessages] = useState<MongoMessages[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userProfiles, setUserProfiles] = useState<{[key: number]: string}>({});
  const [unreadRooms, setUnreadRooms] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 스크롤을 최하단으로 이동하는 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 컴포넌트 마운트 시 현재 사용자 ID 설정 및 Socket.IO 연결
  useEffect(() => {
    const token = getCookieValue('accesstoken');
    const userId = getCurrentUserId();
    
    if (!token || !userId) {
      setError('인증 토큰이 필요합니다. 로그인해주세요.');
      return;
    }

    setCurrentUserId(userId);
    // Socket.IO 연결
    socketService.connect(token);

    return () => {
      socketService.disconnect();
    };
  }, []);

  // currentUserId가 설정되면 DM 방 목록 자동 로드
  useEffect(() => {
    if (currentUserId) {
      loadDMRooms();
    }
  }, [currentUserId]);

  const changeCurrentUser = (newUserId: number) => {
    setCurrentUserId(newUserId);
  };

  // 사용자 프로필 로드
  const loadUserProfile = async (userId: number) => {
    if (userProfiles[userId]) return userProfiles[userId];
    
    try {
      const response = await ProfileServer.ProfileUserGet(userId);
      const name = response.data.profile?.name || `User ${userId}`;
      setUserProfiles(prev => ({ ...prev, [userId]: name }));
      return name;
    } catch (error) {
      console.error(`Failed to load profile for user ${userId}:`, error);
      const fallbackName = `User ${userId}`;
      setUserProfiles(prev => ({ ...prev, [userId]: fallbackName }));
      return fallbackName;
    }
  };

  // DM 채팅방 목록 로드
  const loadDMRooms = async () => {
    try {
      setLoading(true);
      const response = await MessageServer.getDMRooms();
      const rooms = response.data;
      
      // 최신 메시지 기준으로 정렬
      const sortedRooms = rooms.sort((a: MongoRooms, b: MongoRooms) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
      
      setDmRooms(sortedRooms);
      
      // 각 방의 상대방 프로필 미리 로드
      for (const room of sortedRooms) {
        if (currentUserId && room.participants) {
          const otherUserId = room.participants.find(id => id !== currentUserId);
          if (otherUserId) {
            await loadUserProfile(otherUserId);
          }
        }
      }
    } catch (err: any) {
      console.error('❌ Failed to load DM rooms:', err);
      setError(err.response?.data?.error || 'Failed to load DM rooms');
      setDmRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // 채팅방 상세 정보 및 메시지 로드
  const loadRoomDetail = async (roomId: string) => {
    // 방 클릭 즉시 빨간선 제거 (UI 반응성 향상)
    setUnreadRooms(prev => {
      const newSet = new Set(prev);
      newSet.delete(roomId);
      return newSet;
    });

    try {
      setLoading(true);
      const response = await MessageServer.getDMRoomDetail(roomId);
      setSelectedRoom(response.data.room);
      // messages가 배열인지 확인하고 아니면 빈 배열로 설정
      const messages = Array.isArray(response.data.messages) ? response.data.messages : [];
      setMessages(messages);
      
      // 메시지를 읽음으로 표시
      if (messages.length > 0 && currentUserId) {
        const lastMessage = messages[messages.length - 1];
        try {
          await MessageServer.markAsRead(roomId, lastMessage._id || '');
        } catch (markReadErr) {
          console.error('Failed to mark as read:', markReadErr);
          // 서버 읽음 처리 실패 시에도 UI는 이미 업데이트됨
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load room details');
      setMessages([]); // 에러 시 빈 배열로 설정
    } finally {
      setLoading(false);
      // loading 완료 후 DOM 업데이트를 기다린 다음 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 500);
    }
  };

  // 새 DM 채팅방 생성
  const createNewDMRoom = async () => {
    if (!targetUserId || typeof targetUserId !== 'number') {
      setError('Please enter a valid user ID');
      return;
    }

    try {
      setLoading(true);
      const response = await MessageServer.createDMRoom({ targetUserId });
      await loadDMRooms(); // 목록 새로고침
      setTargetUserId('');
      setError(null);
      
      // 새로 생성된 방으로 이동
      if (response.data._id) {
        await loadRoomDetail(response.data._id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create DM room');
    } finally {
      setLoading(false);
    }
  };

  // 방 업데이트 알림 핸들러 (lastMessage 변경)
  const handleRoomUpdated = useCallback((data: { roomId: string, lastMessage: any }) => {
    setDmRooms(prevRooms => {
      return prevRooms.map(room => {
        if (room._id === data.roomId) {
          return {
            ...room,
            lastMessage: data.lastMessage,
            updatedAt: data.lastMessage.createdAt
          };
        }
        return room;
      }).sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
    });
  }, []);

  // 새 방 생성 알림 핸들러
  const handleNewRoom = useCallback((data: { room: MongoRooms, type: string }) => {
    setDmRooms(prevRooms => {
      // 중복 방지
      if (prevRooms.some(room => room._id === data.room._id)) {
        return prevRooms;
      }
      
      // 새 방을 맨 위에 추가하고 정렬
      const newRooms = [data.room, ...prevRooms];
      return newRooms.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
    });

    // 새 방의 상대방 프로필 로드
    if (currentUserId && data.room.participants) {
      const otherUserId = data.room.participants.find(id => id !== currentUserId);
      if (otherUserId) {
        loadUserProfile(otherUserId);
      }
    }
  }, [currentUserId, loadUserProfile]);

  // 실시간 메시지 수신 핸들러
  const handleNewMessage = useCallback((message: MongoMessages) => {
    
    // 현재 선택된 방의 메시지이고, 본인이 보낸 메시지가 아닌 경우에만 화면에 추가
    if (selectedRoom && message.roomId === selectedRoom._id && message.userId !== currentUserId) {
      setMessages(prevMessages => [...prevMessages, message]);
      setTimeout(scrollToBottom, 100);
    }
    
    // 본인이 보낸 메시지가 아닌 경우 읽지 않음으로 표시 (현재 선택된 방이 아닌 경우만)
    if (message.userId !== currentUserId && (!selectedRoom || message.roomId !== selectedRoom._id)) {
      setUnreadRooms(prev => {
        const newSet = new Set(prev).add(message.roomId);
        return newSet;
      });
    }
    
    // 방 목록에서 해당 방을 맨 위로 이동 (lastMessage 업데이트)
    setDmRooms(prevRooms => {
      const updatedRooms = prevRooms.map(room => {
        if (room._id === message.roomId) {
          return {
            ...room,
            lastMessage: {
              messageId: message._id || '',
              content: message.content,
              createdAt: message.createdAt,
              userId: message.userId
            },
            updatedAt: message.createdAt
          };
        }
        return room;
      }).sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
      return updatedRooms;
    });
  }, [selectedRoom, currentUserId]);

  // 전역 Socket.IO 메시지 리스너 등록 (모든 방의 메시지 수신)
  useEffect(() => {
    if (currentUserId) {
      
      socketService.onNewMessage(handleNewMessage);
      socketService.onNewRoom(handleNewRoom);
      
      // 추가 디버깅: 모든 Socket.IO 이벤트 수신
      const socket = socketService.getSocket();
      if (socket) {
        socket.onAny((eventName, ...args) => {
        });
      }
      
      return () => {
        socketService.offNewMessage(handleNewMessage);
        socketService.offNewRoom(handleNewRoom);
        if (socket) {
          socket.offAny();
        }
      };
    }
  }, [currentUserId, handleNewMessage, handleNewRoom]);

  // 선택된 방이 변경될 때 Socket.IO 방 참여/나가기
  useEffect(() => {
    if (selectedRoom && selectedRoom._id) {
      socketService.joinRoom(selectedRoom._id);
      
      return () => {
        if (selectedRoom._id) {
          socketService.leaveRoom(selectedRoom._id);
        }
      };
    }
  }, [selectedRoom]);

  // DM 방 목록에 자동으로 참여 (모든 방의 메시지를 받기 위해)
  useEffect(() => {
    if (dmRooms.length > 0) {
      dmRooms.forEach(room => {
        if (room._id) {
          socketService.joinRoom(room._id);
        }
      });
    }
  }, [dmRooms]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!selectedRoom?._id || !newMessage.trim()) {
      return;
    }

    try {
      setLoading(true);
      const response = await MessageServer.sendMessage(selectedRoom._id, {
        content: newMessage.trim(),
        messageType: 'text'
      });
      
      // 내가 보낸 메시지는 즉시 UI에 추가
      const newMsg: MongoMessages = {
        _id: response.data._id,
        roomId: selectedRoom._id!,
        userId: currentUserId!,
        content: newMessage.trim(),
        messageType: 'text',
        createdAt: new Date(),
        isDeleted: false,
        isEdited: false
      };
      setMessages(prevMessages => [...prevMessages, newMsg]);
      // 내가 메시지 보낸 후 스크롤을 하단으로
      setTimeout(scrollToBottom, 100);
      
      setNewMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 시간 포맷팅
  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="sidebar-header">
          <h2>Direct Messages</h2>
          <div className="create-dm-section">
            <input
              type="number"
              placeholder="User ID"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value ? Number(e.target.value) : '')}
              className="user-id-input"
            />
            <button 
              onClick={createNewDMRoom}
              disabled={loading}
              className="create-dm-btn"
            >
              New DM
            </button>
          </div>
        </div>
        
        <div className="dm-rooms-list">
          {Array.isArray(dmRooms) && dmRooms.map((room) => {
            const isUnread = unreadRooms.has(room._id || '');
            return (
              <div
                key={room._id}
                className={`dm-room-item ${selectedRoom?._id === room._id ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
                onClick={() => room._id && loadRoomDetail(room._id)}
              >
                <div className="room-info">
                <div className="room-name">
                  {currentUserId && room.participants ? 
                    (() => {
                      const otherUserId = room.participants.find(id => id !== currentUserId);
                      return otherUserId ? (userProfiles[otherUserId] || `User ${otherUserId}`) : 'Unknown User';
                    })()
                    : 'No participants'
                  }
                </div>
                {room.lastMessage && (
                  <div className="last-message">
                    <span className="message-content">
                      {room.lastMessage.content}
                    </span>
                    <span className="message-time">
                      {formatMessageTime(room.lastMessage.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      <div className="messages-main">
        {selectedRoom ? (
          <>
            <div className="chat-header">
              <h3>Chat with Users: {Array.isArray(selectedRoom.participants) ? selectedRoom.participants.join(', ') : 'No participants'}</h3>
            </div>
            
            <div className="messages-list">
              {Array.isArray(messages) && messages.map((message) => {
                const isOwnMessage = Number(message.userId) === Number(currentUserId);
                return (
                  <div key={message._id} className={`message-wrapper ${isOwnMessage ? 'own-wrapper' : 'other-wrapper'}`}>
                    <div className={`message-item ${isOwnMessage ? 'own-message' : 'other-message'}`}>
                      <div className="message-header">
                        <span className="message-sender">User {message.userId} {isOwnMessage ? '(Me)' : ''}</span>
                      </div>
                      <div className="message-content">
                        {message.content}
                      </div>
                      {message.isEdited && (
                        <span className="message-edited">(edited)</span>
                      )}
                    </div>
                    <div className="message-time">
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                );
              })}
              {/* 스크롤 타겟 요소 */}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-section">
              <div className="message-input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="message-input"
                  disabled={loading}
                />
                <button 
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim()}
                  className="send-btn"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-room-selected">
            <h3>Select a DM room to start chatting</h3>
            <p>Choose a conversation from the sidebar or create a new one</p>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default Messages;
