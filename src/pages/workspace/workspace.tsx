import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import WorkspaceServer from "../../api/workspace/workspace";
import { WorkspaceDashboardData } from "../../interface/WorkspaceDashboard";
import './workspace.css';

function Workspace() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const [workspaceData, setWorkspaceData] = useState<WorkspaceDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [selectedMember, setSelectedMember] = useState<any>(null);

    useEffect(() => {
        if (workspaceId) {
            WorkspaceServer.WorkspaceList(Number(workspaceId)).then((res) => {
                setWorkspaceData(res.data);
                setError(null);
                setLoading(false);
            }).catch((error) => {
                console.error("Workspace data fetch error:", error);
                setError("워크스페이스 데이터를 불러오는데 실패했습니다.");
                setLoading(false);
            });
        }
    }, [workspaceId]);

    if (loading) {
        return (
            <div className="workspace-dashboard">
                <div className="loading">워크스페이스 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="workspace-dashboard">
                <div className="error">{error}</div>
            </div>
        );
    }

    if (!workspaceData) {
        return (
            <div className="workspace-dashboard">
                <div className="error">워크스페이스 데이터가 없습니다.</div>
            </div>
        );
    }

    const workspace = workspaceData.workspace[0];
    const members = workspaceData.workspaceMember || [];
    const teams = workspaceData.workspaceTeam || [];
    const memberProfiles = workspaceData.memberProfiles || [];
    const memberAttendance = workspaceData.memberAttendance || [];
    const teamDetails = workspaceData.teamDetails || [];
    const workspaceTasks = workspaceData.workspaceTasks || [];

    // Calculate today's attendance
    const today = new Date().toDateString();
    const todayAttendance = memberAttendance.filter(member =>
        member.attendanceRecords.some(record =>
            new Date(record.createdAt).toDateString() === today
        )
    );

    const attendanceRate = members.length > 0 ? (todayAttendance.length / members.length) * 100 : 0;
    const attendedAngle = (attendanceRate / 100) * 360;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getMemberProfile = (userId: number) => {
        const memberProfile = memberProfiles.find(mp => mp.userId === userId);
        return memberProfile?.profile[0] || null;
    };

    const isMemberAttendedToday = (userId: number) => {
        const memberAtt = memberAttendance.find(ma => ma.userId === userId);
        if (!memberAtt) return false;

        return memberAtt.attendanceRecords.some(record =>
            new Date(record.createdAt).toDateString() === today
        );
    };

    const handleTeamClick = (teamDetail: any) => {
        setSelectedTeam(teamDetail);
        setSelectedMember(null); // Reset selected member when team changes
    };

    const handleMemberClick = (member: any) => {
        setSelectedMember(member);
    };

    const getTasksForMember = (teamMemberId: number) => {
        return workspaceTasks.filter(task => task.teamMemberId === teamMemberId);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#16a34a';
            default: return '#64748b';
        }
    };

    const getStateColor = (state: string) => {
        switch (state.toLowerCase()) {
            case 'completed': return '#16a34a';
            case 'in progress': return '#2563eb';
            case 'pending': return '#f59e0b';
            default: return '#64748b';
        }
    };

    return (
        <div className="workspace-dashboard">
            {/* Top bar */}
            <div className="topbar">
                <button
                    className="back-button"
                    onClick={() => navigate('/')}
                >
                    ← 대시보드로 돌아가기
                </button>
                <div className="spacer"></div>
            </div>

            <div className="grid">
                {/* Workspace Header */}
                <section className="workspace-header card">
                    <div className="workspace-info">
                        <div className="workspace-avatar">
                            {getInitials(workspace.name)}
                        </div>
                        <div className="workspace-details">
                            <h1>{workspace.name}</h1>
                            <p>{workspace.description}</p>
                            <div className="workspace-meta">
                                <span>생성일: {formatDate(workspace.createdAt)}</span>
                                <span>관리자 ID: {workspace.adminId}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Attendance Chart */}
                <section className="attendance-chart card pad">
                    <div className="chart-header">
                        <h3>오늘의 출석 현황</h3>
                    </div>
                    <div className="attendance-summary">
                        <div className="pie-chart-container">
                            <div
                                className="pie-chart"
                                style={{ '--attended-angle': `${attendedAngle}deg` } as React.CSSProperties}
                            >
                                <div className="pie-chart-text">
                                    <div className="pie-chart-percentage">{Math.round(attendanceRate)}%</div>
                                    <div className="pie-chart-label">출석률</div>
                                </div>
                            </div>
                        </div>
                        <div className="attendance-legend">
                            <div className="legend-item">
                                <div className="legend-color attended"></div>
                                <span>출석 ({todayAttendance.length}명)</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-color not-attended"></div>
                                <span>미출석 ({members.length - todayAttendance.length}명)</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Members Section */}
                <section className="members-section card pad">
                    <div className="chart-header">
                        <h3>멤버 목록</h3>
                        <span>총 {members.length}명</span>
                    </div>
                    <div className="members-list">
                        {members.map((member) => {
                            const profile = getMemberProfile(member.userId);
                            const attendedToday = isMemberAttendedToday(member.userId);

                            return (
                                <div key={member.id} className="member-item">
                                    <div className="member-avatar">
                                        {profile ? getInitials(profile.name) : 'U'}
                                    </div>
                                    <div className="member-info">
                                        <div className="member-name">
                                            {profile?.name || `User ${member.userId}`}
                                        </div>
                                        <div className="member-role">{member.role}</div>
                                    </div>
                                    <div className={`attendance-status ${attendedToday ? 'attended' : 'not-attended'}`}>
                                        {attendedToday ? '출석' : '미출석'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Stats Section */}
                <section className="stats-section card pad">
                    <h3>워크스페이스 통계</h3>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-number">{members.length}</div>
                            <div className="stat-label">총 멤버</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{teams.length}</div>
                            <div className="stat-label">팀</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{todayAttendance.length}</div>
                            <div className="stat-label">오늘 출석</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{Math.round(attendanceRate)}%</div>
                            <div className="stat-label">출석률</div>
                        </div>
                    </div>
                </section>

                {/* Teams Section */}
                <section className="teams-section card pad">
                    <div className="chart-header">
                        <h3>팀 목록</h3>
                        <span>총 {teamDetails.length}개</span>
                    </div>
                    {teamDetails.length > 0 ? (
                        <div className="teams-grid">
                            {teamDetails.map((teamDetail) => {
                                const manager = getMemberProfile(teamDetail.team.managerId);
                                const isSelected = selectedTeam?.team.id === teamDetail.team.id;
                                return (
                                    <div
                                        key={teamDetail.team.id}
                                        className={`team-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleTeamClick(teamDetail)}
                                    >
                                        <div className="team-name">{teamDetail.team.name}</div>
                                        <div className="team-manager">
                                            관리자: {manager?.name || `User ${teamDetail.team.managerId}`}
                                        </div>
                                        <div className="team-stats">
                                            <span>멤버: {teamDetail.members.length}명</span>
                                            <span>작업: {teamDetail.tasks.length}개</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-teams">
                            <p>생성된 팀이 없습니다.</p>
                        </div>
                    )}
                </section>

                {/* Team Members Section */}
                <section className="team-members-section card pad">
                    <div className="chart-header">
                        <h3>팀 멤버</h3>
                        <span>{selectedTeam ? `총 ${selectedTeam.members.length}명` : '팀을 선택해주세요'}</span>
                    </div>
                    {selectedTeam ? (
                        selectedTeam.members.length > 0 ? (
                            <div className="team-members-list">
                                {selectedTeam.members.map((teamMember: any) => {
                                    const workspaceMember = members.find(m => m.id === teamMember.memberId);
                                    const profile = workspaceMember ? getMemberProfile(workspaceMember.userId) : null;
                                    const taskCount = getTasksForMember(teamMember.id).length;
                                    const isSelected = selectedMember?.id === teamMember.id;

                                    return (
                                        <div
                                            key={teamMember.id}
                                            className={`team-member-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleMemberClick(teamMember)}
                                        >
                                            <div className="member-avatar">
                                                {profile ? getInitials(profile.name) : 'U'}
                                            </div>
                                            <div className="member-info">
                                                <div className="member-name">
                                                    {profile?.name || `User ${workspaceMember?.userId}`}
                                                </div>
                                                <div className="member-role">{teamMember.role}</div>
                                            </div>
                                            <div className="member-task-count">
                                                작업 {taskCount}개
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-members">
                                <p>팀에 멤버가 없습니다.</p>
                            </div>
                        )
                    ) : (
                        <div className="no-selection">
                            <p>팀을 먼저 선택해주세요.</p>
                        </div>
                    )}
                </section>

                {/* Tasks Section */}
                {selectedMember && (
                    <section className="workspace-table-card card">
                        <div className="workspace-toolbar">
                            <div className="workspace-tabs">
                                <a className="active" href="#">{selectedMember.user?.name || '멤버'}의 작업 목록</a>
                            </div>
                            <div className="workspace-sp"></div>
                            <span className="workspace-l">총 {getTasksForMember(selectedMember.id).length}개</span>
                        </div>
                        <div className="workspace-table-wrap">
                            <table className="workspace-table">
                                <thead>
                                    <tr>
                                        <th>번호</th>
                                        <th>작업명</th>
                                        <th>우선순위</th>
                                        <th>상태</th>
                                        <th>생성일</th>
                                        <th>수정일</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getTasksForMember(selectedMember.id).map((task, index) => (
                                        <tr key={task.id}>
                                            <td>{index + 1}</td>
                                            <td>{task.task}</td>
                                            <td>
                                                <span
                                                    className="workspace-priority-badge"
                                                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                                                >
                                                    {task.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className="workspace-state-badge"
                                                    style={{ backgroundColor: getStateColor(task.state) }}
                                                >
                                                    {task.state}
                                                </span>
                                            </td>
                                            <td>{formatDate(task.createdAt)}</td>
                                            <td>{formatDate(task.updatedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {getTasksForMember(selectedMember.id).length === 0 && (
                            <div className="workspace-no-tasks">
                                <p>할당된 작업이 없습니다.</p>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}

export default Workspace;
