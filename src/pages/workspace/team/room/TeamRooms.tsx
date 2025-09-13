import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Outlet, useLocation, useParams } from 'react-router-dom';
import TeamMessageServer from "../../../../api/workspace/team/teamMessage";
import TeamMemberAPI from "../../../../api/workspace/team/teamMember";
import ProfileService from "../../../../api/user/profile/profile";
import useSocket from "../../../../hooks/useSocket";
import { WorkspaceRoom } from '../../../../interface/Room';
import { MemberWithProfile } from '../../../../interface/Member';
import styles from './TeamRooms.module.css';

function TeamRooms() {
    const navigate = useNavigate();
    const location = useLocation();
    const { workspaceId, teamId, roomId } = useParams<{ workspaceId: string; teamId: string; roomId: string }>();
    const [rooms, setRooms] = useState<WorkspaceRoom[]>([]);
    const [members, setMembers] = useState<MemberWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [membersLoading, setMembersLoading] = useState(false);
    const [lastMessages, setLastMessages] = useState<{ [key: number]: string }>({});
    const [inviteUserId, setInviteUserId] = useState('');
    const [inviting, setInviting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [teamMembersLoading, setTeamMembersLoading] = useState(false);

    const isRoomDetailPage = location.pathname.includes(`/workspace/${workspaceId}/team/${teamId}/room/`) && roomId;

    // Initialize Socket.IO connection for real-time room updates
    const {
        isConnected,
        onRoomUpdated
    } = useSocket();

    const loadRooms = async () => {
        if (!workspaceId || !teamId) return;

        try {
            setLoading(true);
            const res = await TeamMessageServer.TeamRoomList(Number(workspaceId), Number(teamId));
            setRooms(res.data || []);
            setError(null);

            // Load last messages for each room
            const messagesMap: { [key: number]: string } = {};
            const roomsWithMessageTimes = await Promise.all(
                (res.data || []).map(async (room: WorkspaceRoom) => {
                    if (room.room[0].lastMessageId) {
                        try {
                            const messageRes = await TeamMessageServer.TeamMessageList(Number(workspaceId), Number(teamId), room.roomId);
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
            const sortedRooms = roomsWithMessageTimes.sort((a, b) => {
                const timeA = new Date(a.lastMessageTime || a.createdAt).getTime();
                const timeB = new Date(b.lastMessageTime || b.createdAt).getTime();
                return timeB - timeA;
            });

            setRooms(sortedRooms);
            setLastMessages(messagesMap);
        } catch (err) {
            console.error('Failed to load team rooms:', err);
            setError('Failed to load team rooms');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = useCallback(async () => {
        if (!roomId || !workspaceId || !teamId) return;

        try {
            setMembersLoading(true);
            const res = await TeamMessageServer.TeamMemberList(Number(workspaceId), Number(teamId), Number(roomId));
            const memberProfiles = await Promise.all(
                res.data.members.map(async (member: any) => {
                    const profileRes = await ProfileService.getProfile(member.userId);
                    return profileRes.data.profile;
                })
            );
            setMembers(memberProfiles);
        } catch (err) {
            console.error('Failed to load members:', err);
        } finally {
            setMembersLoading(false);
        }
    }, [roomId, workspaceId, teamId]);

    const loadTeamMembers = useCallback(async () => {
        if (!workspaceId || !teamId) return;

        try {
            setTeamMembersLoading(true);
            const res = await TeamMemberAPI.getTeamMembers(Number(workspaceId), Number(teamId));
            const membersWithProfiles = await Promise.all(
                res.data.map(async (member: any) => {
                    try {
                        const profileRes = await ProfileService.getProfile(member.profile[0].userId);
                        return {
                            ...member,
                            profile: profileRes.data.profile,
                            name: profileRes.data.profile?.name || `User ${member.id}`
                        };
                    } catch (err) {
                        console.error(`Failed to load profile for user ${member.id}:`, err);
                        return {
                            ...member,
                            profile: null,
                            name: `User ${member.id}`
                        };
                    }
                })
            );
            setTeamMembers(membersWithProfiles);
        } catch (err) {
            console.error('Failed to load team members:', err);
        } finally {
            setTeamMembersLoading(false);
        }
    }, [workspaceId, teamId]);

    const inviteUser = async () => {
        if (!inviteUserId || !workspaceId || !teamId || !roomId) return;

        try {
            setInviting(true);
            await TeamMessageServer.TeamRoomMemberAdd(Number(workspaceId), Number(teamId), Number(roomId), Number(inviteUserId));
            setInviteUserId('');
            setShowInviteModal(false);
            await loadMembers();
        } catch (err: any) {
            console.error('Failed to invite user:', err);
            const errorMessage = err.response?.data?.message || '사용자 초대에 실패했습니다.';
            alert(errorMessage);
        } finally {
            setInviting(false);
        }
    };

    const createRoom = async () => {
        if (!workspaceId || !teamId) return;

        try {
            setLoading(true);
            const roomName = prompt("팀 채팅방 이름을 입력하세요:");
            if (!roomName) {
                setLoading(false);
                return;
            }

            await TeamMessageServer.TeamRoomCreate(Number(workspaceId), Number(teamId), {
                title: roomName,
                description: ""
            });
            await loadRooms();
            alert("팀 채팅방 생성 완료");
        } catch (err) {
            console.error('Failed to create team room:', err);
            setError('Failed to create team room');
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRooms();
    }, [workspaceId, teamId]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    // Refresh room list when navigating back from room detail
    useEffect(() => {
        loadRooms();
        loadTeamMembers();
        if (roomId) {
            loadMembers();
        }
    }, [loadMembers, loadTeamMembers, roomId]);

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
                            onClick={() => navigate(`/workspace/${workspaceId}/team/${teamId}/dashboard`)}
                            className={styles.backButton}
                            title="팀 대시보드로 돌아가기"
                        >
                            ←
                        </button>
                        <h3>Team Rooms</h3>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            onClick={createRoom}
                            className={styles.refreshButton}
                            disabled={loading}
                            title="Create new team room"
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
                        Loading team rooms...
                    </div>
                ) : (
                    <div className={styles.roomsList}>
                        {rooms.length === 0 ? (
                            <div className={styles.emptyState}>
                                No team rooms found
                            </div>
                        ) : (
                            rooms.map((room) => (
                                <div
                                    key={room.roomId}
                                    className={styles.roomItem}
                                    onClick={() => navigate(`/workspace/${workspaceId}/team/${teamId}/room/${room.roomId}`)}
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
                        <h3>팀 멤버 초대</h3>
                        {teamMembersLoading ? (
                            <div className={styles.loading}>팀 멤버 목록을 불러오는 중...</div>
                        ) : (
                            <select
                                value={inviteUserId}
                                onChange={(e) => setInviteUserId(e.target.value)}
                                className={styles.inviteSelect}
                            >
                                <option value="">초대할 팀 멤버를 선택하세요</option>
                                {teamMembers
                                    .filter(member => !members.some(roomMember => roomMember.userId === member.profile?.userId))
                                    .map((member) => (
                                        <option key={member.id || member.profile?.userId} value={member.profile?.userId}>
                                            {member.name} (ID: {member.profile?.userId})
                                        </option>
                                    ))
                                }
                            </select>
                        )}
                        <div className={styles.modalActions}>
                            <button
                                onClick={inviteUser}
                                disabled={inviting || !inviteUserId || teamMembersLoading}
                                className={styles.inviteButton}
                            >
                                {inviting ? '초대 중...' : '초대'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setInviteUserId('');
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

export default TeamRooms;
