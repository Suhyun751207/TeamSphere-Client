import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import RoomsService from "../../api/user/rooms/rooms";
import ProfileService from "../../api/user/profile/profile";
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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
            } else {
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
        setSending(false); 
        
        const newMessageObj: MessageWithProfile = {
            id: Date.now(), 
            roomId: parseInt(roomId),
            userId: parseInt(localStorage.getItem('userId') || '0'),
            type: 'text',
            content: messageContent,
            imagePath: null,
            isEdited: false,
            isValid: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userName: currentUserName
        };
        setMessages(prev => [...prev, newMessageObj]);
        setTimeout(scrollToBottom, 100);

        try {
            const messageRes = await RoomsService.RoomMessageCreate(parseInt(roomId), messageContent);
            
            if (messageRes.data && messageRes.data.insertId) {
                setMessages(prev => prev.map(msg => 
                    msg.id === newMessageObj.id 
                        ? { ...msg, id: messageRes.data.insertId }
                        : msg
                ));
                
                try {
                    await RoomsService.RoomLastMessageUpdate(parseInt(roomId), messageRes.data.insertId);
                    window.dispatchEvent(new CustomEvent('roomUpdated'));
                } catch (updateErr) {
                    console.error('Failed to update room lastMessageId:', updateErr);
                }
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message');
            setMessages(prev => prev.filter(msg => msg.id !== newMessageObj.id));
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
            const profileRes = await ProfileService.getMe();
            setCurrentUserName(profileRes.data.user?.name || profileRes.data.profile?.name || 'You');
        } catch (err) {
            console.error('Failed to fetch current user:', err);
            setCurrentUserName('You');
        }
    };

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
            </div>

            <form onSubmit={sendMessage} className={styles.messageForm}>
                <div className={styles.inputContainer}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
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
