import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import RoomsService from "../../api/user/rooms/rooms";
import ProfileService from "../../api/user/Profile";
import useSocket from "../../hooks/useSocket";
import styles from './RoomDetail.module.css';

interface Message {
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

interface MessageWithProfile extends Message {
    userName?: string;
}

interface Member {
    id: number;
    roomId: number;
    userId: number;
    lastMessageId: number | null;
    createdAt: string;
    userName?: string;
    isOnline?: boolean;
}


function RoomDetail() {
    const { roomId } = useParams<{ roomId: string }>();
    const [messages, setMessages] = useState<MessageWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [inviteUserId, setInviteUserId] = useState('');
    const [inviting, setInviting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [currentUserName, setCurrentUserName] = useState<string>('');
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const [typingUserNames, setTypingUserNames] = useState<Map<number, string>>(new Map());
    const [isTyping, setIsTyping] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [showMembersList, setShowMembersList] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize Socket.IO connection
    const {
        isConnected,
        connectionError,
        joinRoom,
        leaveRoom,
        sendMessage: sendSocketMessage,
        startTyping,
        stopTyping,
        onNewMessage,
        onMessageError,
        onUserTyping,
        onUserOnline,
        onUserOffline
    } = useSocket();

    const loadMembers = useCallback(async () => {
        if (!roomId) return;
        
        try {
            const membersRes = await RoomsService.RoomMembersSelect(parseInt(roomId));
            const membersArray = Array.isArray(membersRes.data) ? membersRes.data : [];
            
            // Fetch user names for members (server already provides isOnline status)
            const membersWithNames = await Promise.all(
                membersArray.map(async (member: Member) => {
                    try {
                        const profileRes = await ProfileService.ProfileUserGet(member.userId);
                        return {
                            ...member,
                            userName: profileRes.data.profile?.name || `User ${member.userId}`
                        };
                    } catch (err) {
                        return {
                            ...member,
                            userName: `User ${member.userId}`
                        };
                    }
                })
            );
            
            setMembers(membersWithNames);
        } catch (err) {
            console.error('Failed to load members:', err);
        }
    }, [roomId]);

    const loadRoomData = useCallback(async () => {
        if (!roomId) return;
        
        try {
            setLoading(true);
            const res = await RoomsService.RoomMessageSelect(parseInt(roomId));
            
            if (res.data.messages) {
                const messagesArray = res.data.messages;
                
                const messagesWithProfiles = await Promise.all(
                    messagesArray.map(async (message: Message) => {
                        try {
                            const profileRes = await ProfileService.ProfileUserGet(message.userId);
                            const userName = profileRes.data.user?.name || profileRes.data.profile?.name || `User ${message.userId}`;
                            return { ...message, userName };
                        } catch (err) {
                            console.error(`Failed to load profile for user ${message.userId}:`, err);
                            return { ...message, userName: `User ${message.userId}` };
                        }
                    })
                );
                
                setMessages(messagesWithProfiles);
            } else {
                const messagesArray = Array.isArray(res.data) ? res.data : [];
                const messagesWithProfiles = await Promise.all(
                    messagesArray.map(async (message: Message) => {
                        try {
                            const profileRes = await ProfileService.ProfileUserGet(message.userId);
                            const userName = profileRes.data.user?.name || profileRes.data.profile?.name || `User ${message.userId}`;
                            return { ...message, userName };
                        } catch (err) {
                            console.error(`Failed to load profile for user ${message.userId}:`, err);
                            return { ...message, userName: `User ${message.userId}` };
                        }
                    })
                );
                setMessages(messagesWithProfiles);
            }
            setError(null);
        } catch (err) {
            console.error('Failed to load room data:', err);
            setError('Failed to load room data');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId || !newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage(''); 
        setSending(true);
        
        // Stop typing indicator
        if (isTyping) {
            stopTyping(parseInt(roomId));
            setIsTyping(false);
        }

        try {
            // Send via Socket.IO for real-time delivery
            if (isConnected) {
                sendSocketMessage(parseInt(roomId), messageContent);
            } else {
                // Fallback to REST API if Socket.IO is not connected
                const messageRes = await RoomsService.RoomMessageCreate(parseInt(roomId), messageContent);
                
                if (messageRes.data && messageRes.data.insertId) {
                    // Add message to local state for immediate feedback
                    // Helper function to get userId from cookies
                    const getUserIdFromCookie = (): number => {
                        const cookies = document.cookie.split(';');
                        for (let cookie of cookies) {
                            const [name, value] = cookie.trim().split('=');
                            if (name === 'userId') {
                                return parseInt(decodeURIComponent(value)) || 0;
                            }
                        }
                        return 0;
                    };

                    const newMessageObj: MessageWithProfile = {
                        id: messageRes.data.insertId,
                        roomId: parseInt(roomId),
                        userId: getUserIdFromCookie(),
                        type: 'TEXT',
                        content: messageContent,
                        imagePath: null,
                        isEdited: false,
                        isValid: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        userName: currentUserName
                    };
                    setMessages(prev => [...prev, newMessageObj]);
                    
                    try {
                        await RoomsService.RoomLastMessageUpdate(parseInt(roomId), messageRes.data.insertId);
                        window.dispatchEvent(new CustomEvent('roomUpdated'));
                    } catch (updateErr) {
                        console.error('Failed to update room lastMessageId:', updateErr);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const inviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId || !inviteUserId.trim() || inviting) return;

        try {
            setInviting(true);
            await RoomsService.RoomUserInvite(parseInt(roomId), parseInt(inviteUserId.trim()));
            setInviteUserId('');
            setShowInviteModal(false);
            await loadRoomData();
        } catch (err) {
            console.error('Failed to invite user:', err);
            setError('Failed to invite user');
        } finally {
            setInviting(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const profileRes = await ProfileService.ProfileAllGet();
            setCurrentUserName(profileRes.data.user?.name || profileRes.data.profile?.name || 'You');
        } catch (err) {
            console.error('Failed to fetch current user:', err);
            setCurrentUserName('You');
        }
    };

    // Handle typing indicators
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNewMessage(value);

        if (!roomId || !isConnected) return;

        // Start typing indicator if not already typing
        if (value.trim() && !isTyping) {
            startTyping(parseInt(roomId));
            setIsTyping(true);
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            if (isTyping) {
                stopTyping(parseInt(roomId));
                setIsTyping(false);
            }
        }, 2000);

        // Stop typing if input is empty
        if (!value.trim() && isTyping) {
            stopTyping(parseInt(roomId));
            setIsTyping(false);
        }
    };

    // Socket.IO event listeners
    useEffect(() => {
        if (!roomId || !isConnected) return;

        // Join the room when component mounts or roomId changes
        joinRoom(parseInt(roomId));

        // Listen for new messages
        const unsubscribeNewMessage = onNewMessage(async (message) => {
            try {
                // Get user profile for the message
                const profileRes = await ProfileService.ProfileUserGet(message.userId);
                const userName = profileRes.data.user?.name || profileRes.data.profile?.name || `User ${message.userId}`;
                
                const messageWithProfile: MessageWithProfile = {
                    ...message,
                    createdAt: new Date(message.createdAt).toISOString(),
                    updatedAt: new Date(message.updatedAt).toISOString(),
                    userName
                };

                setMessages(prev => {
                    // Check if message already exists to avoid duplicates
                    const exists = prev.some(msg => msg.id === message.id);
                    if (exists) return prev;
                    return [...prev, messageWithProfile];
                });

                setTimeout(scrollToBottom, 100);
                window.dispatchEvent(new CustomEvent('roomUpdated'));
            } catch (err) {
                console.error('Failed to load profile for new message:', err);
                const messageWithProfile: MessageWithProfile = {
                    ...message,
                    createdAt: new Date(message.createdAt).toISOString(),
                    updatedAt: new Date(message.updatedAt).toISOString(),
                    userName: `User ${message.userId}`
                };
                
                setMessages(prev => {
                    const exists = prev.some(msg => msg.id === message.id);
                    if (exists) return prev;
                    return [...prev, messageWithProfile];
                });
                setTimeout(scrollToBottom, 100);
            }
        });

        // Listen for message errors
        const unsubscribeMessageError = onMessageError((error) => {
            console.error('Socket message error:', error);
            setError(`Message error: ${error.error}`);
        });

        // Helper function to get userId from cookies
        const getUserIdFromCookie = (): number => {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'userId') {
                    return parseInt(decodeURIComponent(value)) || 0;
                }
            }
            return 0;
        };

        // Listen for typing indicators
        const unsubscribeUserTyping = onUserTyping(async (data) => {
            const currentUserId = getUserIdFromCookie();
            if (data.userId === currentUserId) return; // Ignore own typing

            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (data.isTyping) {
                    newSet.add(data.userId);
                } else {
                    newSet.delete(data.userId);
                }
                return newSet;
            });

            // Fetch user name if not already cached and user is typing
            if (data.isTyping) {
                setTypingUserNames(prev => {
                    if (!prev.has(data.userId)) {
                        // Fetch user name asynchronously
                        ProfileService.ProfileUserGet(data.userId)
                            .then(response => {
                                setTypingUserNames(prevNames => 
                                    new Map(prevNames).set(data.userId, response.data.profile.name || `User ${data.userId}`)
                                );
                            })
                            .catch(() => {
                                setTypingUserNames(prevNames => 
                                    new Map(prevNames).set(data.userId, `User ${data.userId}`)
                                );
                            });
                        return new Map(prev).set(data.userId, `User ${data.userId}`); // Temporary name
                    }
                    return prev;
                });
            }
        });

        // Listen for user join/leave events to refresh member list
        const unsubscribeUserOnline = onUserOnline((data) => {
            if (roomId && parseInt(roomId) === data.roomId) {
                // Refresh member list to get updated online status from server
                loadMembers();
            }
        });

        const unsubscribeUserOffline = onUserOffline((data) => {
            if (roomId && parseInt(roomId) === data.roomId) {
                // Refresh member list to get updated online status from server
                loadMembers();
            }
        });

        // Cleanup function
        return () => {
            if (roomId) {
                leaveRoom(parseInt(roomId));
            }
            unsubscribeNewMessage();
            unsubscribeMessageError();
            unsubscribeUserTyping();
            unsubscribeUserOnline();
            unsubscribeUserOffline();
        };
    }, [roomId, isConnected, onNewMessage, onMessageError, onUserTyping, onUserOnline, onUserOffline, joinRoom, leaveRoom, loadMembers]);

    // Load members when room changes or online users change
    useEffect(() => {
        loadRoomData();
        loadMembers();
    }, [loadRoomData, loadMembers]);

    useEffect(() => {
        loadRoomData();
        fetchCurrentUser();
    }, [loadRoomData]);

    useEffect(() => {
        if (messages.length > 0 && !loading) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, loading]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!roomId) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Invalid room ID</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Room #{roomId}</h2>
                <div className={styles.headerButtons}>
                    <div className={styles.connectionStatus}>
                        {isConnected ? (
                            <span className={styles.connected}>🟢 Real-time</span>
                        ) : (
                            <span className={styles.disconnected}>🔴 Offline</span>
                        )}
                    </div>
                    <button 
                        onClick={() => setShowMembersList(!showMembersList)}
                        className={styles.membersButton}
                        title="Show members"
                    >
                        👥 ({members.length})
                    </button>
                    <button 
                        onClick={loadRoomData} 
                        className={styles.refreshButton}
                        disabled={loading}
                    >
                        {loading ? '⟳' : '↻'}
                    </button>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}

            <div className={styles.messagesContainer}>
                {loading ? (
                    <div className={styles.loading}>
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        No messages in this room yet. Start the conversation!
                    </div>
                ) : (
                    <div className={styles.messagesList}>
                        {messages.map((message) => (
                            <div key={message.id} className={styles.messageItem}>
                                <div className={styles.messageHeader}>
                                    <span className={styles.userId}>{message.userName}</span>
                                    <span className={styles.messageDate}>
                                        {formatDate(message.createdAt)}
                                    </span>
                                </div>
                                <div className={styles.messageContent}>
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
                
                {/* Typing indicators */}
                {typingUsers.size > 0 && (
                    <div className={styles.typingIndicator}>
                        {Array.from(typingUsers).length === 1 
                            ? `${typingUserNames.get(Array.from(typingUsers)[0]) || `User ${Array.from(typingUsers)[0]}`} is typing...`
                            : `${Array.from(typingUsers).length} users are typing...`
                        }
                    </div>
                )}
            </div>

            {/* Members sidebar */}
            {showMembersList && (
                <div className={styles.membersSidebar}>
                    <div className={styles.membersHeader}>
                        <h3>Members ({members.length})</h3>
                        <button 
                            onClick={() => setShowMembersList(false)}
                            className={styles.closeSidebar}
                        >
                            ✕
                        </button>
                    </div>
                    <div className={styles.membersList}>
                        {members.map((member) => (
                            <div key={member.id} className={styles.memberItem}>
                                <div className={styles.memberInfo}>
                                    <span className={`${styles.onlineStatus} ${member.isOnline ? styles.online : styles.offline}`}>
                                        {member.isOnline ? '🟢' : '⚫'}
                                    </span>
                                    <span className={styles.memberName}>
                                        {member.userName || `User ${member.userId}`}
                                    </span>
                                </div>
                                <span className={styles.memberStatus}>
                                    {member.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={sendMessage} className={styles.messageForm}>
                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        className={styles.messageInput}
                        disabled={sending}
                    />
                    <button 
                        type="submit" 
                        className={styles.sendButton}
                        disabled={sending || !newMessage.trim()}
                    >
                        {sending ? '⟳' : 'Send'}
                    </button>
                </div>
            </form>

            {showInviteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>방으로 초대하기</h3>
                            <button 
                                onClick={() => setShowInviteModal(false)}
                                className={styles.closeButton}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={inviteUser} className={styles.inviteForm}>
                            <input
                                type="number"
                                value={inviteUserId}
                                onChange={(e) => setInviteUserId(e.target.value)}
                                placeholder="Enter User ID"
                                className={styles.inviteInput}
                                disabled={inviting}
                                required
                            />
                            <div className={styles.modalButtons}>
                                <button 
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className={styles.cancelButton}
                                    disabled={inviting}
                                >
                                    취소
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles.inviteSubmitButton}
                                    disabled={inviting || !inviteUserId.trim()}
                                >
                                    {inviting ? '초대 중...' : '초대'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoomDetail;
