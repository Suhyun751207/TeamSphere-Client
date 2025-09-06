import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Outlet, useLocation, useParams } from 'react-router-dom';
import RoomsService from "../../../api/user/rooms/rooms";
import ProfileService from "../../../api/user/profile/profile";
import useSocket from "../../../hooks/useSocket";
import styles from './Rooms.module.css';

interface Room {
    id: number;
    roomId: number;
    userId: number;
    lastMessageId: number | null;
    createdAt: string;
    lastMessageTime?: string; // 마지막 메시지 시간 추가
    room?: {
        title?: string;
        lastMessageId?: number | null;
    };
}

interface Member {
    id: number;
    roomId: number;
    userId: number;
    lastMessageId: number | null;
    createdAt: string;
}

interface MemberWithProfile extends Member {
    userName?: string;
}

function Rooms() {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams<{ roomId: string }>();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [members, setMembers] = useState<MemberWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [membersLoading, setMembersLoading] = useState(false);
    const [inviteUserId, setInviteUserId] = useState('');
    const [inviting, setInviting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [lastMessages, setLastMessages] = useState<{[key: number]: string}>({});
    
    const isRoomDetailPage = location.pathname.includes('/user/rooms/') && location.pathname !== '/user/rooms';

    // Initialize Socket.IO connection for real-time room updates
    const {
        isConnected,
        onRoomUpdated
    } = useSocket();

    const loadRooms = async () => {
        try {
            setLoading(true);
            const res = await RoomsService.RoomsSelect();
            setRooms(res.data);
            setError(null);
            
            const messagesMap: {[key: number]: string} = {};
            const roomsWithMessageTimes = await Promise.all(
                res.data.map(async (room: Room) => {
                    const messageId = room.room?.lastMessageId || room.lastMessageId;
                    if (messageId) {
                        try {
                            const messageRes = await RoomsService.MessageSelect(room.roomId, messageId);
                            messagesMap[room.roomId] = messageRes.data.content || 'No content';
                            return {
                                ...room,
                                lastMessageTime: messageRes.data.createdAt
                            };
                        } catch (err) {
                            console.error(`Failed to load message ${messageId} for room ${room.roomId}:`, err);
                            messagesMap[room.roomId] = 'Failed to load message';
                            return {
                                ...room,
                                lastMessageTime: room.createdAt // fallback to room createdAt
                            };
                        }
                    } else {
                        messagesMap[room.roomId] = 'No messages yet';
                        return {
                            ...room,
                            lastMessageTime: room.createdAt // fallback to room createdAt
                        };
                    }
                })
            );
            
            // Sort rooms by last message time (most recent first)
            const sortedRooms = roomsWithMessageTimes.sort((a, b) => {
                const timeA = new Date(a.lastMessageTime || a.createdAt).getTime();
                const timeB = new Date(b.lastMessageTime || b.createdAt).getTime();
                return timeB - timeA;
            });
            
            setRooms(sortedRooms);
            setLastMessages(messagesMap);
        } catch (err) {
            console.error('Failed to load rooms:', err);
            setError('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = useCallback(async () => {
        if (!roomId) return;
        
        try {
            setMembersLoading(true);
            const res = await RoomsService.RoomMessageSelect(parseInt(roomId));
            
            if (res.data.members) {
                const membersArray = Array.isArray(res.data.members) ? res.data.members : [res.data.members];
                
                const membersWithProfiles = await Promise.all(
                    membersArray.map(async (member: Member) => {
                        try {
                            const profileRes = await ProfileService.getProfile(member.userId);
                            const userName = profileRes.data.user?.name || profileRes.data.profile?.name || `User ${member.userId}`;
                            return { ...member, userName };
                        } catch (err) {
                            console.error(`Failed to load profile for user ${member.userId}:`, err);
                            return { ...member, userName: `User ${member.userId}` };
                        }
                    })
                );
                
                setMembers(membersWithProfiles);
            }
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setMembersLoading(false);
        }
    }, [roomId]);

    const inviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId || !inviteUserId.trim() || inviting) return;

        try {
            setInviting(true);
            await RoomsService.RoomUserInvite(parseInt(roomId), parseInt(inviteUserId.trim()));
            setInviteUserId('');
            setShowInviteModal(false);
            await loadMembers();
        } catch (err) {
            console.error('Failed to invite user:', err);
        } finally {
            setInviting(false);
        }
    };

    const createRoom = async () => {
        try {
            setLoading(true);
            await RoomsService.RoomsCreate();
            await loadRooms();
            alert("방 생성 완료")
        } catch (err) {
            console.error('Failed to create room:', err);
            setError('Failed to create room');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRooms();
    }, []);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Refresh room list when navigating back from room detail
    useEffect(() => {
        if (!isRoomDetailPage) {
            loadRooms();
        }
    }, [isRoomDetailPage]);

    // Real-time room updates via Socket.IO
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribeRoomUpdated = onRoomUpdated(async (data) => {
            const { roomId: updatedRoomId, lastMessageId, lastMessage } = data;
            
            // Update rooms state with new lastMessageId
            setRooms(prevRooms => {
                // Update the room with new lastMessageId and lastMessageTime
                const updatedRooms = prevRooms.map(room => {
                    if (room.roomId === updatedRoomId) {
                        return {
                            ...room,
                            lastMessageId: lastMessageId,
                            lastMessageTime: lastMessage.createdAt, // 새 메시지 시간으로 업데이트
                            room: {
                                ...room.room,
                                lastMessageId: lastMessageId
                            }
                        };
                    }
                    return room;
                });

                // Sort rooms by last message time (most recent first)
                return updatedRooms.sort((a, b) => {
                    const timeA = a.roomId === updatedRoomId ? 
                        new Date(lastMessage.createdAt).getTime() : 
                        new Date(a.lastMessageTime || a.createdAt).getTime();
                    const timeB = b.roomId === updatedRoomId ? 
                        new Date(lastMessage.createdAt).getTime() : 
                        new Date(b.lastMessageTime || b.createdAt).getTime();
                    return timeB - timeA;
                });
            });

            // Update last messages display
            setLastMessages(prevMessages => ({
                ...prevMessages,
                [updatedRoomId]: lastMessage.content
            }));
        });

        return unsubscribeRoomUpdated;
    }, [isConnected, onRoomUpdated]);

    // Add event listener for custom room update events (fallback)
    useEffect(() => {
        const handleRoomUpdate = () => {
            if (!isConnected) {
                loadRooms();
            }
        };

        window.addEventListener('roomUpdated', handleRoomUpdate);
        return () => {
            window.removeEventListener('roomUpdated', handleRoomUpdate);
        };
    }, [isConnected]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftNavbar}>
                <div className={styles.navbarHeader}>
                    <div className={styles.headerLeft}>
                        <button 
                            onClick={() => navigate(-1)} 
                            className={styles.backButton}
                            title="뒤로 가기"
                        >
                            ←
                        </button>
                        <h3>My Rooms</h3>
                    </div>
                    <div className={styles.headerActions}>
                        <button 
                            onClick={createRoom} 
                            className={styles.refreshButton}
                            disabled={loading}
                            title="Create new room"
                        >
                            {loading ? '⟳' : '+'}
                        </button>
                    </div>
                </div>
                
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}
                
                {loading ? (
                    <div className={styles.loading}>
                        Loading rooms...
                    </div>
                ) : (
                    <div className={styles.roomsList}>
                        {rooms.length === 0 ? (
                            <div className={styles.emptyState}>
                                No rooms found
                            </div>
                        ) : (
                            rooms.map((room) => (
                                <div 
                                    key={room.id} 
                                    className={styles.roomItem}
                                    onClick={() => navigate(`/user/rooms/${room.roomId}`)}
                                >
                                    <div className={styles.roomInfo}>
                                        <span className={styles.roomName}>
                                            {room.room?.title || `Room ${room.roomId}`}
                                        </span>
                                        <span className={styles.roomDate}>
                                            {formatDate(room.createdAt)}
                                        </span>
                                        {lastMessages[room.roomId] ? (
                                            <span className={styles.lastMessage}>
                                                {lastMessages[room.roomId]}
                                            </span>
                                        ) : (
                                            <span className={styles.noMessages}>
                                                No messages
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {isRoomDetailPage && (
                <div className={styles.rightNavbar}>
                    <div className={styles.navbarHeader}>
                        <h3>Members</h3>
                        <div className={styles.headerActions}>
                            {membersLoading && <div className={styles.loadingSpinner}></div>}
                            <button 
                                onClick={() => setShowInviteModal(true)} 
                                className={styles.addUserButton}
                                disabled={membersLoading}
                                title="Add User"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    <div className={styles.membersList}>
                        {members.length > 0 ? (
                            members.map((member) => (
                                <div key={member.id} className={styles.memberItem}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.userName}</span>
                                        <span className={styles.memberDate}>
                                            {formatDate(member.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                {membersLoading ? 'Loading members...' : 'No members found'}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <div className={styles.content}>
                <Outlet />
            </div>

            {showInviteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Invite User to Room</h3>
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
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles.inviteSubmitButton}
                                    disabled={inviting || !inviteUserId.trim()}
                                >
                                    {inviting ? 'Inviting...' : 'Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Rooms;