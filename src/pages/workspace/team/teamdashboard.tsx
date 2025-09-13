import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeamDashboardData } from '../../../interface/teamDashboard';
import './TeamDashboard.css';
import TeamAPI from '../../../api/workspace/team';
import TeamMessageServer from '../../../api/workspace/team/teamMessage';
import Footer from "../../../components/Footer";

export default function TeamDashboard() {
    const { workspaceId, teamId } = useParams<{ workspaceId: string; teamId: string }>();
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState<TeamDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'tasks'>('overview');
    const [teamRooms, setTeamRooms] = useState<any[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomMessages, setRoomMessages] = useState<{ [key: number]: string }>({});

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 팀 대시보드 데이터 가져오기
            const dashboardResponse = await TeamAPI.getTeamDashboard(Number(workspaceId), Number(teamId));
            setDashboardData(dashboardResponse.data);

            // 팀 채팅방 데이터 가져오기
            await fetchTeamRooms();

        } catch (err) {
            console.error('Error fetching team dashboard data:', err);
            setError('팀 대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [workspaceId, teamId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchTeamRooms = async () => {
        if (!workspaceId || !teamId) return;

        try {
            setRoomsLoading(true);
            const roomsResponse = await TeamMessageServer.TeamRoomList(Number(workspaceId), Number(teamId));
            const rooms = roomsResponse.data || [];
            setTeamRooms(rooms);

            // 각 룸의 마지막 메시지 가져오기
            const messagesMap: { [key: number]: string } = {};
            for (const room of rooms) {
                if (room.room?.[0]?.lastMessageId) {
                    try {
                        const messagesResponse = await TeamMessageServer.TeamMessageList(Number(workspaceId), Number(teamId), room.roomId);
                        const messages = messagesResponse.data || [];
                        const lastMessage = messages.find((msg: any) => msg.id === room.room[0].lastMessageId);
                        if (lastMessage) {
                            messagesMap[room.roomId] = lastMessage.content.length > 30
                                ? lastMessage.content.substring(0, 30) + '...'
                                : lastMessage.content;
                        }
                    } catch (err) {
                        console.error(`Failed to load message for room ${room.roomId}:`, err);
                    }
                }
            }
            setRoomMessages(messagesMap);
        } catch (err) {
            console.error('Error fetching team rooms:', err);
        } finally {
            setRoomsLoading(false);
        }
    };

    const createTeamRoom = async () => {
        if (!workspaceId || !teamId) return;

        try {
            setRoomsLoading(true);
            const roomName = prompt("팀 채팅방 이름을 입력하세요:");
            if (!roomName) {
                setRoomsLoading(false);
                return;
            }

            await TeamMessageServer.TeamRoomCreate(Number(workspaceId), Number(teamId), {
                title: roomName,
                description: ""
            });
            await fetchTeamRooms();
        } catch (err) {
            console.error('Failed to create team room:', err);
            alert('팀 채팅방 생성에 실패했습니다.');
        } finally {
            setRoomsLoading(false);
        }
    };

    const getTaskStats = () => {
        if (!dashboardData?.tasks) return { total: 0, completed: 0, inProgress: 0, todo: 0 };

        const total = dashboardData.tasks.length;
        const completed = dashboardData.tasks.filter(task => task.state === 'Done').length;
        const inProgress = dashboardData.tasks.filter(task => task.state === 'In Progress').length;
        const todo = dashboardData.tasks.filter(task => task.state === 'To Do').length;

        return { total, completed, inProgress, todo };
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'High': return 'teamDashboard-priority-high';
            case 'Medium': return 'teamDashboard-priority-medium';
            case 'Low': return 'teamDashboard-priority-low';
            default: return 'teamDashboard-priority-medium';
        }
    };

    const getStateBadgeClass = (state: string) => {
        switch (state) {
            case 'Done': return 'teamDashboard-state-done';
            case 'In Progress': return 'teamDashboard-state-progress';
            case 'To Do': return 'teamDashboard-state-todo';
            default: return 'teamDashboard-state-todo';
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'teamDashboard-role-admin';
            case 'MEMBER': return 'teamDashboard-role-member';
            default: return 'teamDashboard-role-member';
        }
    };

    const getSubscriptionBadgeClass = (subscription: string) => {
        switch (subscription) {
            case 'Admin': return 'teamDashboard-subscription-admin';
            case 'Pro': return 'teamDashboard-subscription-pro';
            case 'Free': return 'teamDashboard-subscription-free';
            default: return 'teamDashboard-subscription-free';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const getMemberByTeamMemberId = (teamMemberId: number) => {
        return dashboardData?.teamMembers.find(member => member.id === teamMemberId);
    };

    if (loading) {
        return <div className="teamDashboard-loading">팀 대시보드를 불러오는 중...</div>;
    }

    if (error) {
        return <div className="teamDashboard-error">{error}</div>;
    }

    if (!dashboardData || !dashboardData.team[0]) {
        return <div className="teamDashboard-error">팀 데이터를 찾을 수 없습니다.</div>;
    }

    const team = dashboardData.team[0];
    const taskStats = getTaskStats();

    return (
        <>
            <div className="teamDashboard">
                {/* Top bar */}
                <div className="teamDashboard-topbar">
                    <button
                        className="teamDashboard-back-btn"
                        onClick={() => navigate(`/workspace/${workspaceId}`)}
                    >
                        ← 워크스페이스로 돌아가기
                    </button>
                    <h1 className="teamDashboard-title">{team.name} 대시보드</h1>
                </div>
                <div className="teamDashboard-body">
                    {/* Summary Cards */}
                    <div className="teamDashboard-summary-cards">
                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-members-icon">
                                👥
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">팀 멤버</div>
                                <div className="teamDashboard-summary-card-value">{dashboardData.teamMembers.length}</div>
                                <div className="teamDashboard-summary-card-subtitle">활성 멤버</div>
                            </div>
                        </div>

                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-tasks-icon">
                                📋
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">총 작업</div>
                                <div className="teamDashboard-summary-card-value">{taskStats.total}</div>
                                <div className="teamDashboard-summary-card-subtitle">전체 작업</div>
                            </div>
                        </div>

                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-progress-icon">
                                ✅
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">완료율</div>
                                <div className="teamDashboard-summary-card-value">
                                    {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                                </div>
                                <div className="teamDashboard-summary-card-subtitle">
                                    {taskStats.completed}/{taskStats.total} 완료
                                </div>
                            </div>
                        </div>

                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-chat-icon">
                                💬
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">채팅방</div>
                                <div className="teamDashboard-summary-card-value">{dashboardData.teamRooms.length}</div>
                                <div className="teamDashboard-summary-card-subtitle">활성 채팅방</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabbed Content */}
                    <div className="teamDashboard-content-card teamDashboard-tabbed-card">
                        <div className="teamDashboard-tab-header">
                            <button
                                className={`teamDashboard-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                개요
                            </button>
                            <button
                                className={`teamDashboard-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                                onClick={() => setActiveTab('members')}
                            >
                                멤버
                            </button>
                            <button
                                className={`teamDashboard-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tasks')}
                            >
                                작업
                            </button>
                        </div>

                        <div className="teamDashboard-tab-content">
                            {activeTab === 'overview' && (
                                <div className="teamDashboard-overview">
                                    <div className="teamDashboard-overview-grid">
                                        {/* 작업 통계 */}
                                        <div className="teamDashboard-overview-section">
                                            <h3>작업 통계</h3>
                                            <div className="teamDashboard-task-stats">
                                                <div className="teamDashboard-stat-item">
                                                    <span className="teamDashboard-stat-label">할 일</span>
                                                    <span className="teamDashboard-stat-value">{taskStats.todo}</span>
                                                </div>
                                                <div className="teamDashboard-stat-item">
                                                    <span className="teamDashboard-stat-label">진행 중</span>
                                                    <span className="teamDashboard-stat-value">{taskStats.inProgress}</span>
                                                </div>
                                                <div className="teamDashboard-stat-item">
                                                    <span className="teamDashboard-stat-label">완료</span>
                                                    <span className="teamDashboard-stat-value">{taskStats.completed}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 팀 정보 */}
                                        <div className="teamDashboard-overview-section">
                                            <h3>팀 정보</h3>
                                            <div className="teamDashboard-team-info">
                                                <div className="teamDashboard-info-item">
                                                    <span className="teamDashboard-info-label">팀 이름</span>
                                                    <span className="teamDashboard-info-value">{team.name}</span>
                                                </div>
                                                <div className="teamDashboard-info-item">
                                                    <span className="teamDashboard-info-label">워크스페이스 ID</span>
                                                    <span className="teamDashboard-info-value">{team.workspaceId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'members' && (
                                <div className="teamDashboard-members">
                                    <div className="teamDashboard-members-grid">
                                        {dashboardData.teamMembers.map((member) => (
                                            <div key={member.id} className="teamDashboard-member-card">
                                                <div className="teamDashboard-member-avatar">
                                                    {member.profile.imagePath ? (
                                                        <img src={member.profile.imagePath} alt={member.profile.name} />
                                                    ) : (
                                                        member.profile.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="teamDashboard-member-info">
                                                    <div className='teamDashboard-member-name-div'>
                                                        <div>
                                                            <div className="teamDashboard-member-name">{member.profile.name}</div>
                                                            <div className="teamDashboard-member-roles">
                                                                <span className={`teamDashboard-role-badge ${getRoleBadgeClass(member.role)}`}>
                                                                    {member.role}
                                                                </span>
                                                                <span className={`teamDashboard-subscription-badge ${getSubscriptionBadgeClass(member.profile.subscriptionState)}`}>
                                                                    {member.profile.subscriptionState}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="teamDashboard-member-details">
                                                            <span>연락처: {member.profile.phone}</span>
                                                            <span>가입일: {formatDate(member.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="teamDashboard-tasks">
                                    <div className="teamDashboard-tasks-list">
                                        {dashboardData.tasks.map((task) => {
                                            const assignedMember = getMemberByTeamMemberId(task.teamMemberId);
                                            return (
                                                <div key={task.id} className="teamDashboard-task-card">
                                                    <div className="teamDashboard-task-header">
                                                        <div className="teamDashboard-task-title">{task.task}</div>
                                                        <div className="teamDashboard-task-badges">
                                                            <span className={`teamDashboard-priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className={`teamDashboard-state-badge ${getStateBadgeClass(task.state)}`}>
                                                                {task.state}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="teamDashboard-task-details">
                                                        {assignedMember && (
                                                            <div className="teamDashboard-task-assignee">
                                                                <div className="teamDashboard-assignee-avatar">
                                                                    {assignedMember.profile.imagePath ? (
                                                                        <img src={assignedMember.profile.imagePath} alt={assignedMember.profile.name} />
                                                                    ) : (
                                                                        assignedMember.profile.name.charAt(0)
                                                                    )}
                                                                </div>
                                                                <span>{assignedMember.profile.name}</span>
                                                            </div>
                                                        )}
                                                        <div className="teamDashboard-task-dates">
                                                            <span>생성일: {formatDate(task.createdAt)}</span>
                                                            <span>수정일: {formatDate(task.updatedAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team Rooms Section */}
                <section className="teamDashboard-rooms-section teamDashboard-content-card">
                    <div className="teamDashboard-content-card-header">
                        <h3>팀 채팅방</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>총 {teamRooms.length}개</span>
                            <button
                                onClick={createTeamRoom}
                                disabled={roomsLoading}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: roomsLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                                title="새 팀 채팅방 생성"
                            >
                                {roomsLoading ? '⟳' : '+ 채팅방 생성'}
                            </button>
                        </div>
                    </div>
                    {roomsLoading ? (
                        <div className="teamDashboard-loading">팀 채팅방 목록을 불러오는 중...</div>
                    ) : teamRooms.length > 0 ? (
                        <div className="teamDashboard-rooms-list">
                            {teamRooms.map((room) => (
                                <div
                                    key={room.roomId}
                                    className="teamDashboard-room-item"
                                    onClick={() => navigate(`/workspace/${workspaceId}/team/${teamId}/room/${room.roomId}`)}
                                >
                                    <div className="teamDashboard-room-info">
                                        <div className="teamDashboard-room-name">{room.room?.[0]?.title || `Room ${room.roomId}`}</div>
                                        <div className="teamDashboard-room-meta">
                                            <span className="teamDashboard-room-date">생성일: {formatDate(room.createdAt)}</span>
                                            {room.room?.[0]?.lastMessageId ? (
                                                <span className="teamDashboard-last-message">
                                                    마지막 메시지: {roomMessages[room.roomId] || '로딩 중...'}
                                                </span>
                                            ) : (
                                                <span className="teamDashboard-last-message">
                                                    마지막 메시지: 없음
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="teamDashboard-room-arrow">→</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="teamDashboard-no-rooms">
                            <p>생성된 팀 채팅방이 없습니다.</p>
                            <button
                                onClick={createTeamRoom}
                                disabled={roomsLoading}
                                style={{
                                    marginTop: '12px',
                                    padding: '8px 16px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: roomsLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                                title="새 팀 채팅방 생성"
                            >
                                {roomsLoading ? '⟳' : '첫 번째 팀 채팅방 만들기'}
                            </button>
                        </div>
                    )}
                </section>
            </div>
            <Footer />
        </>
    );
}