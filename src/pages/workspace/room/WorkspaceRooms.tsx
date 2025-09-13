import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Outlet, useLocation, useParams } from 'react-router-dom';
import WorkspaceServer from '../../../api/workspace/workspace';
import TeamAPI from '../../../api/workspace/team';
import ProfileServer from '../../../api/user/Profile';
import useSocket from "../../../hooks/useSocket";
import { WorkspaceRoom } from '../../../interface/Room';
import { Member, MemberWithProfile } from '../../../interface/Member';
import styles from './WorkspaceRooms.module.css';

function WorkspaceRooms() {
    const navigate = useNavigate();
    const location = useLocation();
    const { workspaceId, roomId } = useParams<{ workspaceId: string; roomId: string }>();
    const [rooms, setRooms] = useState<WorkspaceRoom[]>([]);
    const [members, setMembers] = useState<MemberWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [membersLoading, setMembersLoading] = useState(false);
    const [lastMessages, setLastMessages] = useState<{ [key: number]: string }>({});
    const [inviteUserId, setInviteUserId] = useState('');
    const [inviting, setInviting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([]);
    const [workspaceMembersLoading, setWorkspaceMembersLoading] = useState(false);
    const [selectedInviteUserId, setSelectedInviteUserId] = useState<string>('');
    const [selectedRoom, setSelectedRoom] = useState<WorkspaceRoom | null>(null);

    const isRoomDetailPage = location.pathname.includes(`/workspace/${workspaceId}/room/`) && roomId;

    // Initialize Socket.IO connection for real-time room updates
    const {
        isConnected,
        onRoomUpdated
    } = useSocket();

    const loadRooms = async () => {
        if (!workspaceId) return;
        try {
            setLoading(true);
            const res = await WorkspaceServer.WorkspaceRoomList(Number(workspaceId));
            setRooms(res.data || []);
            setError(null);

            // Load last messages for each room
            const messagesMap: { [key: number]: string } = {};
            const roomsWithMessageTimes = await Promise.all(
                (res.data || []).map(async (room: WorkspaceRoom) => {
                    if (room.room[0].lastMessageId) {
                        try {
                            const messageRes = await WorkspaceServer.WorkspaceMessageList(Number(workspaceId), room.roomId);
                            const messages = messageRes.data || [];
                            const lastMessage = messages.find((msg: any) => msg.id === room.room[0].lastMessageId);
                            if (lastMessage) {
                                messagesMap[room.roomId] = lastMessage.content || 'No content';
                                if (messagesMap[room.roomId].length > 20) {
                                    messagesMap[room.roomId] = messagesMap[room.roomId].slice(0, 20) + "...";
                                }
                                return {
                                    ...room,
                                    lastMessageTime: lastMessage.createdAt
                                };
                            }
                        } catch (err) {
                            console.error(`Failed to load message for room ${room.roomId}:`, err);
                        }
                    }
                    messagesMap[room.roomId] = 'No messages yet';
                    return {
                        ...room,
                        lastMessageTime: room.createdAt
                    };
                })
            );

            // Sort rooms by last message time (most recent first)
            const sortedRooms = roomsWithMessageTimes.sort((a: any, b: any) => {
                const timeB = new Date(b.lastMessageTime || b.createdAt).getTime();
                const timeA = new Date(a.lastMessageTime || a.createdAt).getTime();
                return timeB - timeA;
            });

            setRooms(sortedRooms);
            setLastMessages(messagesMap);
        } catch (err) {
            console.error('Failed to load workspace rooms:', err);
            setError('Failed to load workspace rooms');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = useCallback(async () => {
        if (!roomId || !workspaceId) return;

        try {
            setMembersLoading(true);
            const res = await WorkspaceServer.WorkspaceMemberList(Number(workspaceId), Number(roomId));
            const memberProfiles = await Promise.all(
                res.data.members.map(async (member: any) => {
                    const profileRes = await ProfileServer.ProfileUserGet(member.userId);
                    return profileRes.data.profile;
                })
            );
            setMembers(memberProfiles);
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setMembersLoading(false);
        }
    }, [roomId, workspaceId]);

    const loadWorkspaceMembers = useCallback(async () => {
        if (!workspaceId) return;

        try {
            setWorkspaceMembersLoading(true);
            const res = await TeamAPI.getWorkspaceMembers(Number(workspaceId));
            const membersWithProfiles = await Promise.all(
                res.data.map(async (member: any) => {
                    try {
                        const profileRes = await ProfileServer.ProfileUserGet(member.userId);
                        return {
                            ...member,
                            profile: profileRes.data.profile,
                            name: profileRes.data.profile?.name || `User ${member.userId}`
                        };
                    } catch (err) {
                        console.error(`Failed to load profile for user ${member.userId}:`, err);
                        return {
                            ...member,
                            profile: null,
                            name: `User ${member.userId}`
                        };
                    }
                })
            );
            setWorkspaceMembers(membersWithProfiles);
        } catch (err) {
            console.error('Failed to load workspace members:', err);
        } finally {
            setWorkspaceMembersLoading(false);
        }
    }, [workspaceId]);

    const inviteUser = async () => {

        if (!selectedInviteUserId || !roomId) return;
        try {
            setInviting(true);
            await WorkspaceServer.WorkspaceRoomMemberAdd(Number(workspaceId), Number(roomId), Number(selectedInviteUserId));
            setShowInviteModal(false);
            setSelectedInviteUserId('');
            loadMembers();
        } catch (err) {
            console.error('Failed to invite user:', err);
        } finally {
            setInviting(false);
        }
    };

    const createRoom = async () => {
        if (!workspaceId) return;

        try {
            setLoading(true);
            const roomName = prompt("채팅방 이름을 입력하세요:");
            if (!roomName) {
                setLoading(false);
                return;
            }

            await WorkspaceServer.WorkspaceRoomCreate(Number(workspaceId), {
                title: roomName,
                description: ""
            });
            await loadRooms();
            alert("워크스페이스 채팅방 생성 완료");
        } catch (err) {
            console.error('Failed to create workspace room:', err);
            setError('Failed to create workspace room');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRooms();
    }, [workspaceId]);

    useEffect(() => {
        if (roomId) {
            loadMembers();
        }
    }, [loadMembers, roomId]);

    // Refresh room list when navigating back from room detail
    useEffect(() => {
        if (!isRoomDetailPage) {
            loadRooms();
        }
    }, [isRoomDetailPage]);

    useEffect(() => {
        if (showInviteModal && workspaceMembers.length === 0) {
            loadWorkspaceMembers();
        }
    }, [showInviteModal, loadWorkspaceMembers, workspaceMembers.length]);

    // Real-time room updates via Socket.IO
    useEffect(() => {
        if (!isConnected) return;

        const unsubscribeRoomUpdated = onRoomUpdated(async (data) => {
            const { roomId: updatedRoomId, lastMessageId, lastMessage } = data;

            // Update rooms state with new lastMessageId
            setRooms(prevRooms => {
                const updatedRooms = prevRooms.map(room => {
                    if (room.roomId === updatedRoomId) {
                        return {
                            ...room,
                            lastMessageId: lastMessageId,
                            lastMessageTime: lastMessage.createdAt
                        };
                    }
                    return room;
                });

                // Sort rooms by last message time (most recent first)
                return updatedRooms.sort((a, b) => {
                    const timeA = a.id === updatedRoomId ?
                        new Date(lastMessage.createdAt).getTime() :
                        new Date(a.lastMessageTime || a.createdAt).getTime();
                    const timeB = b.id === updatedRoomId ?
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
                            onClick={() => navigate(`/workspace/${workspaceId}`)}
                            className={styles.backButton}
                            title="워크스페이스로 돌아가기"
                        >
                            ←
                        </button>
                        <h3>Workspace Rooms</h3>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            onClick={createRoom}
                            className={styles.refreshButton}
                            disabled={loading}
                            title="Create new workspace room"
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
                        Loading workspace rooms...
                    </div>
                ) : (
                    <div className={styles.roomsList}>
                        {rooms.length === 0 ? (
                            <div className={styles.emptyState}>
                                No workspace rooms found
                            </div>
                        ) : (
                            rooms.map((room) => (
                                <div
                                    key={room.roomId}
                                    className={styles.roomItem}
                                    onClick={() => navigate(`/workspace/${workspaceId}/room/${room.roomId}`)}
                                >
                                    <div className={styles.roomInfo}>
                                        <span className={styles.roomName}>
                                            {room.room[0].title || `Room ${room.roomId}`}
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

            <div className={styles.content}>
                <Outlet />
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
                        {members ? (
                            members.map((member) => (
                                <div key={member.userId} className={styles.memberItem}>
                                    <div className={styles.memberInfo}>
                                        <span className={styles.memberName}>{member.name}</span>
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

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>사용자 초대</h3>
                        {workspaceMembersLoading ? (
                            <div className={styles.loadingContainer}>
                                <span>멤버 목록 로딩 중...</span>
                            </div>
                        ) : (
                            <select
                                value={selectedInviteUserId}
                                onChange={(e) => setSelectedInviteUserId(e.target.value)}
                                className={styles.inviteSelect}
                            >
                                <option value="">멤버 선택</option>
                                {workspaceMembers
                                    .filter(member => {
                                        return !members.some(roomMember => roomMember.userId === member.userId);
                                    })
                                    .map((member) => (
                                        <option key={member.userId} value={member.userId}>
                                            {member.name} (ID: {member.userId})
                                        </option>
                                    ))
                                }
                            </select>
                        )}
                        <div className={styles.modalActions}>
                            <button
                                onClick={inviteUser}
                                disabled={inviting || !selectedInviteUserId || workspaceMembersLoading}
                                className={styles.inviteButton}
                            >
                                {inviting ? '초대 중...' : '초대'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setSelectedInviteUserId('');
                                }}
                                className={styles.cancelButton}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspaceRooms;
