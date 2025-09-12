import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeamAPI from "../../../api/workspace/team";
import './teamdashboard.css';

interface Profile {
    userId: number;
    name: string;
    age: number;
    gender: string;
    phone: string;
    imagePath: string | null;
    subscriptionState: string;
    createdAt: string;
    updatedAt: string;
}

interface WorkspaceMember {
    id: number;
    workspaceId: number;
    userId: number;
    role: string;
    createdAt: string;
    updatedAt: string;
}

interface MemberInfo {
    id: number;
    memberId: number;
    teamId: number;
    role: string;
    createdAt: string;
    updatedAt: string;
    workspaceMember: WorkspaceMember;
    profile: Profile[];
}

interface MySQLTask {
    id: number;
    teamMemberId: number;
    state: string;
    priority: string;
    task: string;
    externalId: string | null;
    createdAt: string;
    updatedAt: string;
}

interface TaskDetail {
    mysqlTask: MySQLTask;
    mongoTask: any;
    comments: any[];
}

interface Member {
    memberInfo: MemberInfo;
    memberId: number;
    teamId: number;
    tasks: MySQLTask[];
    taskDetails: TaskDetail[];
}

interface Team {
    id: number;
    name: string;
    workspaceId: number;
    managerId: number;
}

interface Statistics {
    memberCount: number;
    tasks: {
        mongo: {
            total: number;
            pending: number;
            inProgress: number;
            completed: number;
            cancelled: number;
        };
        mysql: {
            total: number;
            todo: number;
            inProgress: number;
            done: number;
            cancelled: number;
        };
    };
    comments: {
        total: number;
        byMember: {
            memberId: number;
            count: number;
        }[];
    };
}

interface RecentActivity {
    mongoTasks: any[];
    mysqlTasks: MySQLTask[];
    comments: any[];
}

interface MemberRoute {
    memberId: number;
    memberInfo: MemberInfo;
    taskDetails: TaskDetail[];
}

interface Summary {
    totalTasks: number;
    completionRate: number;
    totalComments: number;
    activeMembers: number;
}

interface TeamDashboardData {
    team: Team[];
    members: Member[];
    statistics: Statistics;
    recentActivity: RecentActivity;
    routes: {
        memberRoutes: MemberRoute[];
    };
    summary: Summary;
}

export default function TeamDashboard() {
    const { workspaceId, teamId } = useParams<{ workspaceId: string; teamId: string }>();
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<TeamDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'tasks'>('overview');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        if (workspaceId && teamId) {
            fetchTeamDashboard();
            fetchCurrentUser();
        }
    }, [workspaceId, teamId]);

    const fetchTeamDashboard = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await TeamAPI.getTeamDashboard(Number(workspaceId), Number(teamId));
            setDashboardData(response.data);
        } catch (err) {
            console.error('Failed to fetch team dashboard:', err);
            setError('팀 대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            // localStorage에서 사용자 정보 가져오기
            const userInfo = localStorage.getItem('user');
            if (userInfo) {
                setCurrentUser(JSON.parse(userInfo));
            }
        } catch (err) {
            console.error('Failed to fetch current user:', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return 'danger';
            case 'medium': return 'warning';
            case 'low': return 'success';
            default: return 'general';
        }
    };

    const getStateColor = (state: string) => {
        switch (state.toLowerCase()) {
            case 'done': return 'success';
            case 'in progress': return 'warning';
            case 'todo': return 'general';
            case 'cancelled': return 'danger';
            default: return 'general';
        }
    };

    const handleMemberClick = (memberId: number) => {
        navigate(`/workspace/${workspaceId}/teams/${teamId}/member/${memberId}`);
    };

    const handleTaskClick = (taskId: number) => {
        navigate(`/workspace/${workspaceId}/teams/${teamId}/tasks/${taskId}`);
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!dashboardData) {
        return <div className="error">팀 대시보드 데이터를 찾을 수 없습니다.</div>;
    }

    const { team, members, statistics, recentActivity, summary } = dashboardData;
    const teamInfo = team[0];

    return (
        <div className="team-dashboard-container">
            <div className="topbar">
                <div className="title">{teamInfo.name} 대시보드</div>
                <div className="spacer"></div>
                <button 
                    className="action-btn secondary"
                    onClick={() => navigate(`/workspace/${workspaceId}`)}
                >
                    워크스페이스로 돌아가기
                </button>
            </div>

            {/* Summary Cards Section */}
            <div className="summary-cards">
                <div className="summary-card">
                    <div className="summary-card-icon team-icon">👥</div>
                    <div className="summary-card-content">
                        <div className="summary-card-title">팀 멤버</div>
                        <div className="summary-card-value">{statistics.memberCount}</div>
                        <div className="summary-card-subtitle">활성 멤버 {summary.activeMembers}명</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon task-icon">📋</div>
                    <div className="summary-card-content">
                        <div className="summary-card-title">총 작업</div>
                        <div className="summary-card-value">{summary.totalTasks}</div>
                        <div className="summary-card-subtitle">MySQL: {statistics.tasks.mysql.total}개</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon progress-icon">📊</div>
                    <div className="summary-card-content">
                        <div className="summary-card-title">완료율</div>
                        <div className="summary-card-value">{summary.completionRate}%</div>
                        <div className="summary-card-subtitle">진행률 추적</div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ width: `${summary.completionRate}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-card-icon comment-icon">💬</div>
                    <div className="summary-card-content">
                        <div className="summary-card-title">댓글</div>
                        <div className="summary-card-value">{summary.totalComments}</div>
                        <div className="summary-card-subtitle">총 댓글 수</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    개요
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    멤버
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    작업
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-content">
                        <div className="main-content">
                            {/* Left Column */}
                            <div className="left-column">
                                {/* Team Statistics */}
                                <section className="content-card">
                                    <div className="content-card-header">
                                        <div className="content-card-title">
                                            <span className="card-icon">📊</span>
                                            작업 통계
                                        </div>
                                    </div>
                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <div className="stat-label">할 일</div>
                                            <div className="stat-value todo">{statistics.tasks.mysql.todo}</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">진행 중</div>
                                            <div className="stat-value in-progress">{statistics.tasks.mysql.inProgress}</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">완료</div>
                                            <div className="stat-value done">{statistics.tasks.mysql.done}</div>
                                        </div>
                                        <div className="stat-item">
                                            <div className="stat-label">취소</div>
                                            <div className="stat-value cancelled">{statistics.tasks.mysql.cancelled}</div>
                                        </div>
                                    </div>
                                </section>

                                {/* Recent Activity */}
                                <section className="content-card">
                                    <div className="content-card-header">
                                        <div className="content-card-title">
                                            <span className="card-icon">🕒</span>
                                            최근 활동
                                        </div>
                                    </div>
                                    <div className="activity-list">
                                        {recentActivity.mysqlTasks.length > 0 ? (
                                            recentActivity.mysqlTasks.map((task) => (
                                                <div 
                                                    key={task.id} 
                                                    className="activity-item"
                                                    onClick={() => handleTaskClick(task.id)}
                                                >
                                                    <div className={`activity-icon ${getStateColor(task.state)}`}>
                                                        📋
                                                    </div>
                                                    <div className="activity-content">
                                                        <div className="activity-message">{task.task}</div>
                                                        <div className="activity-meta">
                                                            <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className={`state-badge ${getStateColor(task.state)}`}>
                                                                {task.state}
                                                            </span>
                                                        </div>
                                                        <div className="activity-date">{formatDate(task.updatedAt)}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">
                                                <span className="empty-icon">📝</span>
                                                <p>최근 활동이 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Right Column */}
                            <div className="right-column">
                                {/* Team Members Overview */}
                                <section className="content-card">
                                    <div className="content-card-header">
                                        <div className="content-card-title">
                                            <span className="card-icon">👥</span>
                                            팀 멤버
                                        </div>
                                    </div>
                                    <div className="members-overview">
                                        {members && members.length > 0 ? members.map((member) => (
                                            <div 
                                                key={member.memberId} 
                                                className="member-card"
                                                onClick={() => handleMemberClick(member.memberId)}
                                            >
                                                <div className="member-avatar">
                                                    {member.memberInfo?.profile?.[0]?.imagePath ? (
                                                        <img 
                                                            src={member.memberInfo.profile[0].imagePath} 
                                                            alt={member.memberInfo.profile[0].name}
                                                        />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {getInitials(member.memberInfo?.profile?.[0]?.name || 'U')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="member-info">
                                                    <div className="member-name">
                                                        {member.memberInfo?.profile?.[0]?.name || '이름 없음'}
                                                    </div>
                                                    <div className="member-role">
                                                        {member.memberInfo.role}
                                                    </div>
                                                    <div className="member-tasks">
                                                        작업 {member.tasks.length}개
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="no-members">
                                                <p>팀 멤버가 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Comments Statistics */}
                                <section className="content-card">
                                    <div className="content-card-header">
                                        <div className="content-card-title">
                                            <span className="card-icon">💬</span>
                                            댓글 통계
                                        </div>
                                    </div>
                                    <div className="comments-stats">
                                        {statistics.comments.byMember.length > 0 ? (
                                            statistics.comments.byMember.map((memberComment) => {
                                                const member = members.find(m => m.memberId === memberComment.memberId);
                                                return (
                                                    <div key={memberComment.memberId} className="comment-stat-item">
                                                        <div className="comment-member">
                                                            {member?.memberInfo.profile[0]?.name || '알 수 없음'}
                                                        </div>
                                                        <div className="comment-count">
                                                            {memberComment.count}개
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="empty-state">
                                                <span className="empty-icon">💬</span>
                                                <p>댓글이 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="members-content">
                        <div className="members-grid">
                            {members && members.length > 0 ? members.map((member) => (
                                <div 
                                    key={member.memberId} 
                                    className="member-detail-card"
                                    onClick={() => handleMemberClick(member.memberId)}
                                >
                                    <div className="member-header">
                                        <div className="member-avatar-large">
                                            {member.memberInfo?.profile?.[0]?.imagePath ? (
                                                <img 
                                                    src={member.memberInfo.profile[0].imagePath} 
                                                    alt={member.memberInfo.profile[0].name}
                                                />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {getInitials(member.memberInfo?.profile?.[0]?.name || 'U')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="member-basic-info">
                                            <div className="member-name-large">
                                                {member.memberInfo?.profile?.[0]?.name || '이름 없음'}
                                            </div>
                                            <div className="member-role-badge">
                                                {member.memberInfo.role}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="member-stats">
                                        <div className="member-stat">
                                            <span className="stat-label">작업</span>
                                            <span className="stat-value">{member.tasks.length}</span>
                                        </div>
                                        <div className="member-stat">
                                            <span className="stat-label">가입일</span>
                                            <span className="stat-value">{formatDate(member.memberInfo.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="member-tasks-preview">
                                        {member.tasks.slice(0, 3).map((task) => (
                                            <div key={task.id} className="task-preview">
                                                <span className={`task-priority ${getPriorityColor(task.priority)}`}></span>
                                                <span className="task-title">{task.task}</span>
                                                <span className={`task-state ${getStateColor(task.state)}`}>
                                                    {task.state}
                                                </span>
                                            </div>
                                        ))}
                                        {member.tasks.length > 3 && (
                                            <div className="more-tasks">
                                                +{member.tasks.length - 3}개 더
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="no-members">
                                    <p>팀 멤버가 없습니다.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="tasks-content">
                        <div className="tasks-grid">
                            {members.flatMap(member => 
                                member.tasks.map(task => ({ ...task, memberName: member.memberInfo.profile[0]?.name }))
                            ).map((task) => (
                                <div 
                                    key={task.id} 
                                    className="task-card"
                                    onClick={() => handleTaskClick(task.id)}
                                >
                                    <div className="task-header">
                                        <div className="task-title">{task.task}</div>
                                        <div className="task-badges">
                                            <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            <span className={`state-badge ${getStateColor(task.state)}`}>
                                                {task.state}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="task-meta">
                                        <div className="task-assignee">
                                            👤 {task.memberName || '할당자 없음'}
                                        </div>
                                        <div className="task-dates">
                                            <div>생성: {formatDate(task.createdAt)}</div>
                                            <div>수정: {formatDate(task.updatedAt)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {members.every(member => member.tasks.length === 0) && (
                            <div className="empty-state">
                                <span className="empty-icon">📋</span>
                                <p>등록된 작업이 없습니다.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}