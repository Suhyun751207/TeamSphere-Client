import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TeamMessageServer from "../../../../api/workspace/team/teamMessage";
import ProfileService from "../../../../api/user/profile/profile";
import useSocket from "../../../../hooks/useSocket";
import { Message, MessageWithProfile } from '../../../../interface/Message';
import styles from './TeamRoomDetail.module.css';

interface MessageItemProps {
    message: MessageWithProfile;
    formatDate: (dateString: string) => string;
}

function MessageItem({ message, formatDate }: MessageItemProps) {
    const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkCurrentUser = async () => {
            try {
                setLoading(true);
                const profileRes = await ProfileService.getMe();
                const currentUserId = profileRes.data.user?.id || profileRes.data.profile?.userId || profileRes.data.id;
                const isOwner = currentUserId === message.userId;
                setIsCurrentUser(isOwner);
            } catch (err) {
                console.error('Failed to check current user:', err);
                setIsCurrentUser(false);
            } finally {
                setLoading(false);
            }
        };

        checkCurrentUser();
    }, [message.userId, message.id]);

    if (loading) {
        return (
            <div className={styles.messageItem}>
                <div className={styles.loading}>Loading...</div>
            </div>
        );
    }

    return (
        <div className={`${styles.teamMessageWrapper} ${isCurrentUser ? styles.teamMessageWrapperRight : styles.teamMessageWrapperLeft}`}>
            <div className={`${styles.teamMessageItem} ${isCurrentUser ? styles.teamMessageItemRight : styles.teamMessageItemLeft}`}>
                <div className={styles.teamMessageHeader}>
                    <span className={styles.teamUserId}>{message.userName}</span>
                </div>
                <div className={styles.teamMessageContent}>
                    {message.content}
                </div>
            </div>
            <span className={styles.teamMessageDate}>{formatDate(message.createdAt)}</span>
        </div>
    );
}

function TeamRoomDetail() {
    const { workspaceId, teamId, roomId } = useParams<{ workspaceId: string; teamId: string; roomId: string }>();
    const [messages, setMessages] = useState<MessageWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [roomInfo, setRoomInfo] = useState<any>(null);
    const [currentUserName, setCurrentUserName] = useState<string>('');
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const [typingUserNames, setTypingUserNames] = useState<Map<number, string>>(new Map());
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Socket.IO integration
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
    } = useSocket();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadMessages = useCallback(async () => {
        if (!workspaceId || !teamId || !roomId) return;

        try {
            setLoading(true);
            const res = await TeamMessageServer.TeamMessageList(Number(workspaceId), Number(teamId), Number(roomId));
            const messagesData = res.data || [];

            // Get user profiles for messages
            const messagesWithProfiles = await Promise.all(
                messagesData.map(async (message: Message) => {
                    try {
                        const profileRes = await ProfileService.getProfile(message.userId);
                        return {
                            ...message,
                            userName: profileRes.data.profile?.name || `User ${message.userId}`
                        };
                    } catch (err) {
                        console.error(`Failed to load profile for user ${message.userId}:`, err);
                        return {
                            ...message,
                            userName: `User ${message.userId}`
                        };
                    }
                })
            );

            setMessages(messagesWithProfiles);
            setError(null);
        } catch (err) {
            console.error('Failed to load team messages:', err);
            setError('Failed to load team messages');
        } finally {
            setLoading(false);
        }
    }, [workspaceId, teamId, roomId]);

    const loadRoomInfo = useCallback(async () => {
        if (!workspaceId || !teamId || !roomId) return;

        try {
            const res = await TeamMessageServer.TeamRoomInfo(Number(workspaceId), Number(teamId), Number(roomId));
            setRoomInfo(res.data.room);
        } catch (err) {
            console.error('Failed to load team room info:', err);
        }
    }, [workspaceId, teamId, roomId]);

    const fetchCurrentUser = async () => {
        try {
            const profileRes = await ProfileService.getMe();
            setCurrentUserName(profileRes.data.user?.name || profileRes.data.profile?.name || 'You');
        } catch (err) {
            console.error('Failed to fetch current user:', err);
            setCurrentUserName('You');
        }
    };

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

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId || !workspaceId || !teamId || !newMessage.trim() || sending) return;
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
                const profileRes = await ProfileService.getMe();
                const currentUserId = profileRes.data.user?.id || profileRes.data.profile?.userId || profileRes.data.id;

                const optimisticMessage: MessageWithProfile & { isOptimistic?: boolean } = {
                    id: Date.now(), // Temporary ID
                    roomId: parseInt(roomId),
                    userId: currentUserId,
                    content: messageContent,
                    messageType: "TEXT",
                    isEdited: false,
                    isDeleted: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    userName: currentUserName
                };

                setMessages(prev => [...prev, optimisticMessage]);
                setTimeout(scrollToBottom, 100);

            } else {
                // Fallback to API when socket is not connected
                await TeamMessageServer.TeamMessageCreate(Number(workspaceId), Number(teamId), Number(roomId), {
                    content: messageContent
                });
                await loadMessages();
            }
        } catch (err) {
            console.error('Failed to send team message:', err);
            setError('Failed to send team message');
        } finally {
            setSending(false);
            setTimeout(() => {
                messageInputRef.current?.focus();
            }, 100);
        }
    };

    useEffect(() => {
        loadMessages();
        loadRoomInfo();
        fetchCurrentUser();
    }, [loadMessages, loadRoomInfo]);

    useEffect(() => {
        if (messages.length > 0 && !loading) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, loading]);

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
        // Cleanup function
        return () => {
            if (roomId) {
                leaveRoom(parseInt(roomId));
            }
            unsubscribeNewMessage();
            unsubscribeMessageError();
            unsubscribeUserTyping();
        };
    }, [roomId, isConnected, joinRoom, leaveRoom, onNewMessage, onMessageError, onUserTyping]);

    const shouldShowDateSeparator = (currentMessage: MessageWithProfile, previousMessage?: MessageWithProfile) => {
        if (!previousMessage) return true;

        const currentDate = new Date(currentMessage.createdAt);
        const previousDate = new Date(previousMessage.createdAt);

        // 시간이 다르면 구분선 표시
        return currentDate.getHours() !== previousDate.getHours() ||
            currentDate.getDate() !== previousDate.getDate();
    };

    const formatDateSeparator = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
            hour: 'numeric',
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading team room...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{roomInfo?.title || `Team Room ${roomId}`}</h2>
                <div className={styles.connectionStatus}>
                    <span className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
                        {isConnected ? '🟢' : '🔴'}
                    </span>
                    <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>

            <div className={styles.messagesContainer}>
                <div className={styles.messagesList}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyState}>
                            No messages in this team room yet. Start the conversation!
                        </div>
                    ) : (
                        <div className={styles.messagesList}>
                            {messages.map((message, index) => {
                                const previousMessage = index > 0 ? messages[index - 1] : undefined;
                                const showDateSeparator = shouldShowDateSeparator(message, previousMessage);

                                return (
                                    <div key={message.id}>
                                        {showDateSeparator && (
                                            <div className={styles.teamDateSeparator_date}>
                                                <span>
                                                    {formatDateSeparator(message.createdAt)}
                                                </span>
                                            </div>
                                        )}
                                        <MessageItem
                                            message={message}
                                            formatDate={formatDate}
                                        />
                                    </div>
                                );
                            })}
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

                <form onSubmit={sendMessage} className={styles.messageForm}>
                    <div className={styles.inputContainer}>
                        <input
                            ref={messageInputRef}
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type your team message..."
                            className={styles.messageInput}
                            disabled={sending || !isConnected}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending || !isConnected}
                            className={styles.sendButton}
                        >
                            {sending ? '⟳' : '→'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TeamRoomDetail;
