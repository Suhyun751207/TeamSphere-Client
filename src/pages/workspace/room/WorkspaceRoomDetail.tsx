import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import WorkspaceServer from "../../../api/workspace/workspace";
import ProfileService from "../../../api/user/profile/profile";
import useSocket from "../../../hooks/useSocket";
import { Message, MessageWithProfile } from '../../../interface/Message';
import { Member } from '../../../interface/Member';
import styles from './WorkspaceRoomDetail.module.css';

function WorkspaceRoomDetail() {
    const { workspaceId, roomId } = useParams<{ workspaceId: string; roomId: string }>();
    const [messages, setMessages] = useState<MessageWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [currentUserName, setCurrentUserName] = useState<string>('');
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const [typingUserNames, setTypingUserNames] = useState<Map<number, string>>(new Map());
    const [isTyping, setIsTyping] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [showMembersList, setShowMembersList] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);

    // Initialize Socket.IO connection
    const {
        isConnected,
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
        if (!roomId || !workspaceId) return;
        
        try {
            // Note: We'll need workspace room members API
            // For now, we'll use a placeholder
            setMembers([]);
        } catch (err) {
            console.error('Failed to load members:', err);
        }
    }, [roomId, workspaceId]);

    const loadRoomData = useCallback(async () => {
        if (!roomId || !workspaceId) return;
        
        try {
            setLoading(true);
            const res = await WorkspaceServer.WorkspaceMessageList(Number(workspaceId), Number(roomId));
            
            const messagesArray = Array.isArray(res.data) ? res.data : [];
            const messagesWithProfiles = await Promise.all(
                messagesArray.map(async (message: Message) => {
                    try {
                        const profileRes = await ProfileService.getProfile(message.userId);
                        const userName = profileRes.data.user?.name || profileRes.data.profile?.name || `User ${message.userId}`;
                        return { ...message, userName };
                    } catch (err) {
                        console.error(`Failed to load profile for user ${message.userId}:`, err);
                        return { ...message, userName: `User ${message.userId}` };
                    }
                })
            );
            
            setMessages(messagesWithProfiles);
            setError(null);
        } catch (err) {
            console.error('Failed to load workspace room data:', err);
            setError('Failed to load workspace room data');
        } finally {
            setLoading(false);
        }
    }, [roomId, workspaceId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId || !workspaceId || !newMessage.trim() || sending) return;
        const messageContent = newMessage.trim();
        setNewMessage(''); 
        setSending(true);
        
        // Stop typing indicator
        if (isTyping) {
            stopTyping(parseInt(roomId));
            setIsTyping(false);
        }

        try {
            if (isConnected) {
                // Send via Socket.IO for real-time delivery (Socket server handles DB creation)
                sendSocketMessage(parseInt(roomId), messageContent);
                
                // Add optimistic message to local state for immediate feedback
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

                const optimisticMessage: MessageWithProfile & { isOptimistic?: boolean } = {
                    id: Date.now(), // Temporary ID
                    roomId: parseInt(roomId),
                    userId: getUserIdFromCookie(),
                    content: messageContent,
                    messageType: "TEXT",
                    isEdited: false,
                    isDeleted: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    userName: currentUserName,
                    isOptimistic: true // Flag to identify optimistic messages
                };
                
                setMessages(prev => [...prev, optimisticMessage]);
                setTimeout(scrollToBottom, 100);
                
                // Keep the optimistic message - no timeout deletion
            } else {
                const messageRes = await WorkspaceServer.WorkspaceMessageCreate(
                    Number(workspaceId), 
                    Number(roomId), 
                    { content: messageContent, messageType: "TEXT" }
                );
                if (messageRes.data && messageRes.data.insertId) {
                    // Add message to local state for immediate feedback
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
                        content: messageContent,
                        messageType: "TEXT",
                        isEdited: false,
                        isDeleted: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        userName: currentUserName
                    };
                    setMessages(prev => [...prev, newMessageObj]);
                    try {
                        await WorkspaceServer.WorkspaceRoomLastMessageUpdate(
                            Number(workspaceId), 
                            Number(roomId), 
                            messageRes.data.insertId
                        );
                        window.dispatchEvent(new CustomEvent('roomUpdated'));
                    } catch (updateErr) {
                        console.error('Failed to update workspace room lastMessageId:', updateErr);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to send workspace message:', err);
            setError('Failed to send workspace message');
        } finally {
            setSending(false);
            setTimeout(() => {
                messageInputRef.current?.focus();
            }, 100);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            const profileRes = await ProfileService.getMe();
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
        joinRoom(parseInt(roomId));

        // Listen for new messages
        const unsubscribeNewMessage = onNewMessage(async (message) => {
            try {
                // Get user profile for the message
                const profileRes = await ProfileService.getProfile(message.userId);
                const userName = profileRes.data.user?.name || profileRes.data.profile?.name || `User ${message.userId}`;
                
                const messageWithProfile: MessageWithProfile = {
                    ...message,
                    messageType: (message.type === "IMAGE" || message.type === "FILE") ? message.type : "TEXT",
                    isDeleted: false,
                    createdAt: new Date(message.createdAt).toISOString(),
                    updatedAt: new Date(message.updatedAt).toISOString(),
                    userName
                };

                setMessages(prev => {
                    // Clear timeout for optimistic message if it exists
                    const optimisticMsg = prev.find(msg => 
                        (msg as any).isOptimistic && 
                        msg.content === message.content && 
                        msg.userId === message.userId
                    );
                    if (optimisticMsg && (optimisticMsg as any).timeoutId) {
                        clearTimeout((optimisticMsg as any).timeoutId);
                    }
                    
                    // Remove optimistic message if it exists (same content and user)
                    const filteredMessages = prev.filter(msg => 
                        !(msg as any).isOptimistic || 
                        msg.content !== message.content || 
                        msg.userId !== message.userId
                    );
                    
                    // Check if real message already exists to avoid duplicates
                    const exists = filteredMessages.some(msg => msg.id === message.id);
                    if (exists) {
                        return filteredMessages;
                    }
                    return [...filteredMessages, messageWithProfile];
                });

                setTimeout(scrollToBottom, 100);
                window.dispatchEvent(new CustomEvent('roomUpdated'));
            } catch (err) {
                console.error('Failed to load profile for new message:', err);
                const messageWithProfile: MessageWithProfile = {
                    ...message,
                    messageType: (message.type === "IMAGE" || message.type === "FILE") ? message.type : "TEXT",
                    isDeleted: false,
                    createdAt: new Date(message.createdAt).toISOString(),
                    updatedAt: new Date(message.updatedAt).toISOString(),
                    userName: `User ${message.userId}`
                };
                
                setMessages(prev => {
                    // Clear timeout for optimistic message if it exists
                    const optimisticMsg = prev.find(msg => 
                        (msg as any).isOptimistic && 
                        msg.content === message.content && 
                        msg.userId === message.userId
                    );
                    if (optimisticMsg && (optimisticMsg as any).timeoutId) {
                        clearTimeout((optimisticMsg as any).timeoutId);
                    }
                    
                    // Remove optimistic message if it exists
                    const filteredMessages = prev.filter(msg => 
                        !(msg as any).isOptimistic || 
                        msg.content !== message.content || 
                        msg.userId !== message.userId
                    );
                    
                    const exists = filteredMessages.some(msg => msg.id === message.id);
                    if (exists) return filteredMessages;
                    return [...filteredMessages, messageWithProfile];
                });
                setTimeout(scrollToBottom, 100);
                window.dispatchEvent(new CustomEvent('roomUpdated'));
            }
        });

        // Listen for message errors
        const unsubscribeMessageError = onMessageError((error) => {
            console.error('Socket message error:', error);
            setError(`Message error: ${error.error}`);
            
            // Remove failed optimistic messages
            setMessages(prev => prev.filter(msg => !(msg as any).isOptimistic));
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
                        ProfileService.getProfile(data.userId)
                            .then((response: any) => {
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
                loadMembers();
            }
        });

        const unsubscribeUserOffline = onUserOffline((data) => {
            if (roomId && parseInt(roomId) === data.roomId) {
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
    }, [roomId, isConnected, joinRoom, leaveRoom, loadMembers, onNewMessage, onMessageError, onUserTyping, onUserOnline, onUserOffline]);

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

    if (!roomId || !workspaceId) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Invalid workspace or room ID</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Workspace Room #{roomId}</h2>
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
                        No messages in this workspace room yet. Start the conversation!
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
                        ref={messageInputRef}
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
        </div>
    );
}

export default WorkspaceRoomDetail;
