import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import TeamMessageServer from "../../../../api/workspace/team/teamMessage";
import ProfileService from "../../../../api/user/profile/profile";
import useSocket from "../../../../hooks/useSocket";
import { Message, MessageWithProfile } from '../../../../interface/Message';
import { Member } from '../../../../interface/Member';
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
                    <span className={styles.teamMessageDate}>{formatDate(message.createdAt)}</span>
                </div>
                <div className={styles.teamMessageContent}>
                    {message.content}
                </div>
            </div>
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Socket.IO integration
    const {
        isConnected,
        joinRoom,
        leaveRoom,
        sendMessage,
        onNewMessage,
        onMessageError
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending || !workspaceId || !teamId || !roomId) return;

        try {
            setSending(true);
            await TeamMessageServer.TeamMessageCreate(Number(workspaceId), Number(teamId), Number(roomId), {
                content: newMessage.trim()
            });

            // Send via Socket.IO for real-time updates
            if (isConnected) {
                sendMessage(Number(roomId), newMessage.trim());
            }

            setNewMessage('');
            await loadMessages();
        } catch (err) {
            console.error('Failed to send team message:', err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        loadMessages();
        loadRoomInfo();
    }, [loadMessages, loadRoomInfo]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Socket.IO room management
    useEffect(() => {
        if (!isConnected || !roomId) return;

        const roomIdNum = Number(roomId);
        joinRoom(roomIdNum);

        return () => {
            leaveRoom(roomIdNum);
        };
    }, [isConnected, roomId, joinRoom, leaveRoom]);

    // Socket.IO message listeners
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribeNewMessage = onNewMessage(async (messageData) => {
            // Reload messages to get the latest data with profiles
            await loadMessages();
        });

        const unsubscribeMessageError = onMessageError((error) => {
            console.error('Socket message error:', error);
            alert('Message error: ' + (error.error || error.details || 'Unknown error'));
        });

        return () => {
            unsubscribeNewMessage();
            unsubscribeMessageError();
        };
    }, [isConnected, onNewMessage, onMessageError, loadMessages]);

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
                        messages.map((message) => (
                            <MessageItem
                                key={message.id}
                                message={message}
                                formatDate={formatDate}
                            />
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSendMessage} className={styles.messageForm}>
                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your team message..."
                        className={styles.messageInput}
                        disabled={sending || !isConnected}
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
    );
}

export default TeamRoomDetail;
