import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import WorkspaceServer from "../../api/workspace/workspace";
import RoomsService from "../../api/user/rooms/rooms";
import TeamAPI from "../../api/workspace/team";
import TeamMemberAPI from "../../api/workspace/team/teamMember";
import { WorkspaceDashboardData } from "../../interface/WorkspaceDashboard";
import { WorkspaceMemberCreateRequest, ActivityLog, ActivityLogWithUser, ActivityLogsCreate, TeamCreateRequest, TeamMemberCreateRequest } from "../../interface/Workspace";
import Footer from "../../components/Footer";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
// import "./w"
import './dashboard-custom.css';

interface WeeklyAttendanceData {
    date: string;
    day: string;
    attendanceRate: number;
    attendedCount: number;
    totalCount: number;
}

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

function Workspace() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const [workspaceData, setWorkspaceData] = useState<WorkspaceDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [workspaceRooms, setWorkspaceRooms] = useState<any[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomMessages, setRoomMessages] = useState<{ [key: string]: string }>({});
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [newMemberData, setNewMemberData] = useState<WorkspaceMemberCreateRequest>({
        userId: 0,
        role: "MEMBER"
    });
    const [addingMember, setAddingMember] = useState(false);

    // Activity Logs state
    const [activityLogs, setActivityLogs] = useState<ActivityLogWithUser[]>([]);
    const [activityLogsLoading, setActivityLogsLoading] = useState(false);
    const [showActivityLogModal, setShowActivityLogModal] = useState(false);
    const [newActivityLog, setNewActivityLog] = useState<ActivityLogsCreate>({
        message: ''
    });
    const [addingActivityLog, setAddingActivityLog] = useState(false);
    const [selectedActivityUser, setSelectedActivityUser] = useState<number | null>(null);

    // Team creation state
    const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
    const [newTeamData, setNewTeamData] = useState<TeamCreateRequest>({
        name: ''
    });
    const [creatingTeam, setCreatingTeam] = useState(false);

    // Team member management state
    const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);
    const [newTeamMemberData, setNewTeamMemberData] = useState<TeamMemberCreateRequest>({
        memberId: 0,
        role: "MEMBER"
    });
    const [addingTeamMember, setAddingTeamMember] = useState(false);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [teamMembersLoading, setTeamMembersLoading] = useState(false);
    const [currentUserWorkspaceInfo, setCurrentUserWorkspaceInfo] = useState<any>(null);

    // Role management state
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedMemberForRole, setSelectedMemberForRole] = useState<any>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [updatingRole, setUpdatingRole] = useState(false);

    // Calculate weekly attendance data for line chart
    const getWeeklyAttendanceData = useCallback((membersData: any[], workspaceInfo: any): WeeklyAttendanceData[] => {
        if (!workspaceInfo || !membersData || membersData.length === 0) {
            return [];
        }

        // Use Korean timezone for consistent date calculation
        const today = new Date();
        const kstOffset = 9 * 60; // KST is UTC+9
        const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
        const kstTime = new Date(utc + (kstOffset * 60000));

        const weekData: WeeklyAttendanceData[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(kstTime);
            date.setDate(kstTime.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Count unique members who attended on this specific date
            const attendedMemberIds = new Set();

            // Check if memberAttendance exists and has data
            const memberAttendance = workspaceInfo?.memberAttendance || [];

            memberAttendance.forEach((member: any) => {
                if (member.attendanceRecords && Array.isArray(member.attendanceRecords)) {
                    const hasAttendedToday = member.attendanceRecords.some((record: any) => {
                        // Convert UTC to KST (UTC+9)
                        const utcDate = new Date(record.createdAt);
                        const kstDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));
                        const recordDate = kstDate.toISOString().split('T')[0];
                        return recordDate === dateStr;
                    });
                    if (hasAttendedToday) {
                        attendedMemberIds.add(member.userId);
                    }
                }
            });

            const attendedCount = attendedMemberIds.size;
            const attendanceRate = membersData.length > 0 ? (attendedCount / membersData.length) * 100 : 0;

            weekData.push({
                date: dateStr,
                day: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
                attendanceRate: Math.round(attendanceRate * 100) / 100,
                attendedCount: attendedCount,
                totalCount: membersData.length
            });
        }

        return weekData;
    }, []);

    // Check if current user can manage roles (Admin or Manager)
    const canManageRoles = useCallback(() => {
        if (!currentUserWorkspaceInfo) {
            return false;
        }
        const userRole = currentUserWorkspaceInfo.role;
        return userRole === 'Admin' || userRole === 'Manager';
    }, [currentUserWorkspaceInfo]);

    // Handle opening role modal
    const handleOpenRoleModal = useCallback((member: any) => {
        // Prevent admin from changing their own role
        if (currentUserWorkspaceInfo?.role === 'Admin' && member.userId === currentUserWorkspaceInfo.id) {
            alert('관리자는 본인의 역할을 변경할 수 없습니다.');
            return;
        }

        setSelectedMemberForRole(member);
        setNewRole(member.role);
        setShowRoleModal(true);
    }, [currentUserWorkspaceInfo]);

    // Handle role update
    const handleUpdateRole = useCallback(async () => {
        if (!selectedMemberForRole || !workspaceId || !newRole) return;

        try {
            setUpdatingRole(true);
            await WorkspaceServer.WorkspaceMemberUpdate(
                Number(workspaceId),
                { userId: selectedMemberForRole.userId, role: newRole as "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER" }
            );

            // Refresh workspace data
            const workspaceRes = await WorkspaceServer.WorkspaceList(Number(workspaceId));
            setWorkspaceData(workspaceRes.data);

            setShowRoleModal(false);
            setSelectedMemberForRole(null);
            setNewRole('');

            alert('역할이 성공적으로 변경되었습니다.');
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('역할 변경에 실패했습니다.');
        } finally {
            setUpdatingRole(false);
        }
    }, [selectedMemberForRole, workspaceId, newRole, workspaceData]);

    useEffect(() => {
        if (workspaceId) {
            Promise.all([
                WorkspaceServer.WorkspaceList(Number(workspaceId)),
                TeamMemberAPI.getWorkspaceMe(Number(workspaceId))
            ]).then(([workspaceRes, userRes]) => {
                setWorkspaceData(workspaceRes.data);
                setCurrentUserWorkspaceInfo(userRes.data[0]);
                loadWorkspaceRooms();
                setLoading(false);
            }).catch((err) => {
                console.error('Failed to load workspace data:', err);
                setError('워크스페이스 데이터를 불러오는데 실패했습니다.');
                setLoading(false);
            });
        }
    }, [workspaceId]);

    const loadWorkspaceRooms = useCallback(async () => {
        if (!workspaceId) return;

        try {
            setRoomsLoading(true);
            const roomsRes = await WorkspaceServer.WorkspaceRoomList(Number(workspaceId));
            const rooms = roomsRes.data || [];
            setWorkspaceRooms(rooms);

            // Load last messages for each room
            const messagePromises = rooms.map(async (room: any) => {
                if (room.room && room.room[0] && room.room[0].lastMessageId) {
                    try {
                        const messageRes = await RoomsService.MessageSelect(room.room[0].id, room.room[0].lastMessageId);
                        return {
                            roomId: room.room[0].id,
                            content: messageRes.data.content || '메시지를 불러올 수 없습니다'
                        };
                    } catch (error) {
                        console.error(`Failed to load message for room ${room.room[0].id}:`, error);
                        return {
                            roomId: room.room[0].id,
                            content: '메시지를 불러올 수 없습니다'
                        };
                    }
                }
                return null;
            });

            const messages = await Promise.all(messagePromises);
            const messageMap: { [key: string]: string } = {};
            messages.forEach(msg => {
                if (msg) {
                    messageMap[msg.roomId] = msg.content;
                }
            });
            setRoomMessages(messageMap);
        } catch (error) {
            console.error("Workspace rooms fetch error:", error);
        } finally {
            setRoomsLoading(false);
        }
    }, [workspaceId]);

    const loadActivityLogs = useCallback(async () => {
        if (!workspaceId || !workspaceData) return;

        try {
            setActivityLogsLoading(true);
            const response = await WorkspaceServer.WorkspaceActivityLogList(Number(workspaceId));
            const logs = response.data || [];

            // Get workspace members to find the correct userId for each activity log
            const membersResponse = await WorkspaceServer.WorkspaceMembersList(Number(workspaceId));
            const workspaceMembers = membersResponse.data || [];

            // Fetch user profiles for each activity log
            const logsWithUsers = logs.map((log: ActivityLog) => {
                try {
                    // Find workspace member by activity log userId (which matches workspaceMember id)
                    const workspaceMember = workspaceMembers.find((member: any) => member.id === log.userId);
                    console.log(workspaceMember)
                    if (workspaceMember && workspaceMember.user && workspaceMember.profile) {
                        return {
                            ...log,
                            user: {
                                id: workspaceMember.user.id,
                                name: workspaceMember.profile[0].name,
                                imagePath: workspaceMember.profile[0].imagePath
                            }
                        };
                    }
                    
                    // If no workspace member found, use default values
                    return {
                        ...log,
                        user: {
                            id: log.userId,
                            name: `User ${log.userId}`,
                            imagePath: undefined
                        }
                    };
                } catch (error) {
                    console.error(`Failed to fetch user profile for userId ${log.userId}:`, error);
                    return {
                        ...log,
                        user: {
                            id: log.userId,
                            name: `User ${log.userId}`,
                            imagePath: undefined
                        }
                    };
                }
            });

            // Sort logs by createdAt in descending order (newest first)
            const sortedLogs = logsWithUsers.sort((a: ActivityLogWithUser, b: ActivityLogWithUser) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setActivityLogs(sortedLogs);
        } catch (error) {
            console.error("Activity logs fetch error:", error);
        } finally {
            setActivityLogsLoading(false);
        }
    }, [workspaceId, workspaceData]);

    // Load activity logs when workspace data is available
    useEffect(() => {
        if (workspaceData) {
            loadActivityLogs();
        }
    }, [workspaceData, loadActivityLogs]);

    // Load team members when a team is selected
    useEffect(() => {
        if (selectedTeam) {
            loadTeamMembers(selectedTeam.team.id);
        } else {
            setTeamMembers([]);
        }
    }, [selectedTeam]);

    const handleAddActivityLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId || !newActivityLog.message.trim() || addingActivityLog) return;

        try {
            setAddingActivityLog(true);
            await WorkspaceServer.WorkspaceActivityLogCreate(Number(workspaceId), newActivityLog);

            // Refresh activity logs
            await loadActivityLogs();

            // Reset form and close modal
            setNewActivityLog({ message: '' });
            setShowActivityLogModal(false);

            alert("활동 로그 추가 완료");
        } catch (err: any) {
            console.error('Failed to add activity log:', err);
            const errorMessage = err.response?.data?.message || '활동 로그 추가에 실패했습니다.';
            alert(errorMessage);
        } finally {
            setAddingActivityLog(false);
        }
    };

    const handleUserClick = (userId: number) => {
        setSelectedActivityUser(selectedActivityUser === userId ? null : userId);
    };

    const getFilteredActivityLogs = () => {
        if (selectedActivityUser === null) {
            return activityLogs;
        }
        return activityLogs.filter(log => log.userId === selectedActivityUser);
    };

    const getUniqueUsers = () => {
        const uniqueUsers = new Map();
        activityLogs.forEach(log => {
            if (!uniqueUsers.has(log.userId)) {
                uniqueUsers.set(log.userId, {
                    userId: log.userId,
                    user: log.user,
                    logCount: activityLogs.filter(l => l.userId === log.userId).length
                });
            }
        });
        return Array.from(uniqueUsers.values());
    };

    const createRoom = async () => {
        if (!workspaceId) return;

        try {
            setRoomsLoading(true);
            const roomName = prompt("채팅방 이름을 입력하세요:");
            if (!roomName) {
                setRoomsLoading(false);
                return;
            }

            await WorkspaceServer.WorkspaceRoomCreate(Number(workspaceId), {
                title: roomName,
                description: ""
            });
            await loadWorkspaceRooms();
            alert("워크스페이스 채팅방 생성 완료");
        } catch (err) {
            console.error('Failed to create workspace room:', err);
            setError('채팅방 생성에 실패했습니다.');
        } finally {
            setRoomsLoading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspaceId || !newMemberData.userId || addingMember) return;

        try {
            setAddingMember(true);
            await WorkspaceServer.WorkspaceMemberAdd(Number(workspaceId), newMemberData);

            // Refresh workspace data to show new member
            const res = await WorkspaceServer.WorkspaceList(Number(workspaceId));
            setWorkspaceData(res.data);

            // Reset form and close modal
            setNewMemberData({ userId: 0, role: "MEMBER" });
            setShowAddMemberModal(false);

            alert("멤버 추가 완료");
        } catch (err: any) {
            console.error('Failed to add member:', err);
            const errorMessage = err.response?.data?.message || '멤버 추가에 실패했습니다.';
            alert(errorMessage);
        } finally {
            setAddingMember(false);
        }
    };

    const handleMemberFormChange = (field: keyof WorkspaceMemberCreateRequest, value: string | number) => {
        setNewMemberData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Team creation functions
    const handleCreateTeam = async () => {
        if (!workspaceId || !newTeamData.name.trim()) {
            alert('팀 이름을 입력해주세요.');
            return;
        }

        try {
            setCreatingTeam(true);
            await TeamAPI.createWorkspaceTeam(Number(workspaceId), newTeamData);

            // Refresh workspace data to show new team
            const res = await WorkspaceServer.WorkspaceList(Number(workspaceId));
            setWorkspaceData(res.data);

            // Reset form and close modal
            setNewTeamData({ name: '' });
            setShowCreateTeamModal(false);

            alert("팀 생성 완료");
        } catch (err: any) {
            console.error('Failed to create team:', err);
            const errorMessage = err.response?.data?.message || '팀 생성에 실패했습니다.';
            alert(errorMessage);
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleTeamFormChange = (field: keyof TeamCreateRequest, value: string) => {
        setNewTeamData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Team member management functions
    const loadTeamMembers = async (teamId: number) => {
        if (!workspaceId) return;

        try {
            setTeamMembersLoading(true);
            const res = await TeamMemberAPI.getTeamMembers(Number(workspaceId), teamId);
            setTeamMembers(res.data);
        } catch (err: any) {
            console.error('Failed to load team members:', err);
        } finally {
            setTeamMembersLoading(false);
        }
    };

    const handleAddTeamMember = async () => {
        if (!workspaceId || !selectedTeam || !newTeamMemberData.memberId) {
            alert('멤버를 선택해주세요.');
            return;
        }

        try {
            setAddingTeamMember(true);
            await TeamMemberAPI.addTeamMember(Number(workspaceId), selectedTeam.team.id, newTeamMemberData);

            await loadTeamMembers(selectedTeam.team.id);

            // Refresh workspace data to update team member count
            const res = await WorkspaceServer.WorkspaceList(Number(workspaceId));
            setWorkspaceData(res.data);

            // Reset form and close modal
            setNewTeamMemberData({ memberId: 0, role: "MEMBER" });
            setShowAddTeamMemberModal(false);

            alert("팀 멤버 추가 완료");
        } catch (err: any) {
            console.error('Failed to add team member:', err);
            const errorMessage = err.response?.data?.message || '팀 멤버 추가에 실패했습니다.';
            alert(errorMessage);
        } finally {
            setAddingTeamMember(false);
        }
    };

    const handleRemoveTeamMember = async (memberId: number) => {
        if (!workspaceId || !selectedTeam) return;

        try {
            await TeamMemberAPI.removeTeamMember(Number(workspaceId), selectedTeam.team.id, memberId);
            await loadTeamMembers(selectedTeam.team.id);

            // Refresh workspace data to update team member count
            const res = await WorkspaceServer.WorkspaceList(Number(workspaceId));
            setWorkspaceData(res.data);

            alert("팀 멤버 제거 완료");
        } catch (err: any) {
            console.error('Failed to remove team member:', err);
            const errorMessage = err.response?.data?.message || '팀 멤버 제거에 실패했습니다.';
            alert(errorMessage);
        }
    };

    const handleTeamMemberFormChange = (field: keyof TeamMemberCreateRequest, value: string | number) => {
        setNewTeamMemberData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Calculate weekly attendance data using useMemo to avoid recalculation
    const weeklyData = useMemo(() => {
        if (!workspaceData) return [];
        const members = workspaceData.workspaceMember || [];
        return getWeeklyAttendanceData(members, workspaceData);
    }, [workspaceData, getWeeklyAttendanceData]);

    // Chart.js data configuration
    const chartData = useMemo(() => ({
        labels: weeklyData.map(data => data.day),
        datasets: [
            {
                label: '출석률 (%)',
                data: weeklyData.map(data => data.attendanceRate),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0,
                fill: true,
            },
        ],
    }), [weeklyData]);

    // Chart.js options configuration
    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#3b82f6',
                borderWidth: 1,
                callbacks: {
                    label: (context: any) => {
                        const dataIndex = context.dataIndex;
                        const data = weeklyData[dataIndex];
                        return [
                            `출석률: ${data.attendanceRate}%`,
                            `출석: ${data.attendedCount}명`,
                            `전체: ${data.totalCount}명`
                        ];
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: '#f1f5f9',
                    borderColor: '#e2e8f0',
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        size: 12,
                    },
                },
            },
            y: {
                min: 0,
                max: 100,
                beginAtZero: true,
                suggestedMax: 100,
                grid: {
                    color: '#f1f5f9',
                    borderColor: '#e2e8f0',
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        size: 12,
                    },
                    stepSize: 25,
                    callback: (value: any) => `${value}%`,
                },
            },
        },
    }), [weeklyData]);

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

    // Filter teams based on user role
    const getFilteredTeams = () => {
        if (!currentUserWorkspaceInfo) return teamDetails;

        const userRole = currentUserWorkspaceInfo.role;
        const userId = currentUserWorkspaceInfo.id;

        // Admin and Manager can see all teams
        if (userRole === 'ADMIN' || userRole === 'Manager') {
            return teamDetails;
        }

        // Member can only see teams they belong to
        if (userRole === 'MEMBER' || userRole === 'Member') {
            return teamDetails.filter(teamDetail => {
                return teamDetail.members.some((member: any) =>
                    member.memberId === userId
                );
            });
        }

        return teamDetails;
    };

    const filteredTeamDetails = getFilteredTeams();

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
        if (!name || typeof name !== 'string') {
            return 'U';
        }
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
        <>
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

                <div className="grid-workspace">
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
                            <h3>출석 현황</h3>
                        </div>
                        <div className="attendance-summary">
                            <div className="pie-chart-container">
                                <div
                                    className="pie-chart"
                                    style={{ '--attended-angle': `${attendedAngle}deg` } as React.CSSProperties}
                                >
                                    <div className="pie-chart-text">
                                        <div className="pie-chart-percentage">{Math.round(attendanceRate)}%</div>
                                        <div className="pie-chart-label">오늘 출석률</div>
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

                        {/* Weekly Attendance Line Chart */}
                        <div className="weekly-attendance-chart">
                            <h4>주간 출석률 추이</h4>
                            {weeklyData.length > 0 ? (
                                <div className="chart-container" style={{ height: '300px', marginTop: '20px' }}>
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div style={{
                                    height: '300px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px dashed #dee2e6',
                                    borderRadius: '8px',
                                    marginTop: '20px'
                                }}>
                                    <div style={{ textAlign: 'center', color: '#6c757d' }}>
                                        <p>출석 데이터가 없습니다</p>
                                        <small>멤버들의 출석 기록이 생성되면 그래프가 표시됩니다</small>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                    {/* Members Section */}
                    <section className="members-section card pad">
                        <div className="chart-header">
                            <h3>멤버 목록</h3>
                            <span>총 {members.length}명</span>
                            <button
                                onClick={() => setShowAddMemberModal(true)}
                                className="add-member-btn"
                                title="멤버 추가"
                                style={{
                                    marginLeft: 'auto',
                                    padding: '8px 12px',
                                    backgroundColor: '#2563eb',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                +
                            </button>
                        </div>
                        <div className="members-list">
                            {members.slice().sort((a, b) => {
                                const profileA = getMemberProfile(a.userId);
                                const profileB = getMemberProfile(b.userId);

                                const nameA = profileA?.name || `User ${a.userId}`;
                                const nameB = profileB?.name || `User ${b.userId}`;

                                return nameB.localeCompare(nameA);
                            }).map((member) => {
                                const profile = getMemberProfile(member.userId);
                                const attendedToday = isMemberAttendedToday(member.userId);

                                return (
                                    <div key={member.id} className="member-item">
                                        <div className="member-avatar">
                                            {profile?.imagePath ? (
                                                <img src={profile.imagePath} alt={profile.name} />
                                            ) : (
                                                <div className="dropdown-avatar-placeholder">
                                                    {getInitials(profile?.name || 'U')}
                                                </div>
                                            )}
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
                                        {canManageRoles() && (
                                            <button
                                                onClick={() => handleOpenRoleModal(member)}
                                                className="dashboard-btn"
                                                title="역할 설정"
                                                style={{
                                                    marginLeft: '8px',
                                                    padding: '6px',
                                                    fontSize: '14px',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '4px',
                                                    background: 'white',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ⚙️
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Activity Logs Section */}
                    <section className="activity-logs-section card pad">
                        <div className="chart-header">
                            <h3>워크스페이스 활동 로그</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>총 {activityLogs.length}개</span>
                                {selectedActivityUser && (
                                    <button
                                        onClick={() => setSelectedActivityUser(null)}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#f59e0b',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '500'
                                        }}
                                        title="필터 초기화"
                                    >
                                        전체 보기
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowActivityLogModal(true)}
                                    style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                    title="새 활동 로그 작성"
                                >
                                    + 로그 작성
                                </button>
                            </div>
                        </div>
                        {activityLogsLoading ? (
                            <div className="loading">활동 로그를 불러오는 중...</div>
                        ) : activityLogs.length > 0 ? (
                            <div className="activity-logs-container">
                                {/* User List */}
                                <div className="activity-users-list">
                                    <h4>활동 멤버</h4>
                                    <div className="users-grid">
                                        {getUniqueUsers().map((userInfo) => (
                                            <div
                                                key={userInfo.userId}
                                                className={`user-item ${selectedActivityUser === userInfo.userId ? 'selected' : ''}`}
                                                onClick={() => handleUserClick(userInfo.userId)}
                                            >
                                                <div className="user-avatar">
                                                    {userInfo.user?.imagePath ? (
                                                        <img src={userInfo.user.imagePath} alt={userInfo.user.name} />
                                                    ) : (
                                                        <div className="user-avatar-placeholder">
                                                            {getInitials(userInfo.user?.name || 'U')}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="user-info">
                                                    <div className="user-name">{userInfo.user?.name || `User ${userInfo.userId}`}</div>
                                                    <div className="user-log-count">{userInfo.logCount}개 활동</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Activity Logs */}
                                <div className="activity-logs-list">
                                    <h4>
                                        {selectedActivityUser
                                            ? `${getUniqueUsers().find(u => u.userId === selectedActivityUser)?.user?.name || 'User'}의 활동 로그`
                                            : '전체 활동 로그'
                                        }
                                    </h4>
                                    {getFilteredActivityLogs().slice(0, 10).map((log, index) => (
                                        <div key={`${log.userId}-${log.createdAt}-${index}`} className="activity-log-item">
                                            <div className="activity-log-avatar">
                                                {log.user?.imagePath ? (
                                                    <img src={log.user.imagePath} alt={log.user.name} />
                                                ) : (
                                                    <div className="activity-log-avatar-placeholder">
                                                        {getInitials(log.user?.name || 'U')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="activity-log-content">
                                                <div className="activity-log-header">
                                                    <span className="activity-log-user">{log.user?.name || `User ${log.userId}`}</span>
                                                    <span className="activity-log-time">{formatDate(log.createdAt)}</span>
                                                </div>
                                                <div className="activity-log-message">{log.message}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {getFilteredActivityLogs().length > 10 && (
                                        <div className="activity-log-more">
                                            <span>+ {getFilteredActivityLogs().length - 10}개 더 보기</span>
                                        </div>
                                    )}
                                    {getFilteredActivityLogs().length === 0 && selectedActivityUser && (
                                        <div className="no-activity-logs">
                                            <p>이 사용자의 활동 로그가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="no-activity-logs">
                                <p>활동 로그가 없습니다.</p>
                                <button
                                    onClick={() => setShowActivityLogModal(true)}
                                    style={{
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                    title="새 활동 로그 작성"
                                >
                                    첫 번째 로그 작성하기
                                </button>
                            </div>
                        )}
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

                    {/* Workspace Rooms Section */}
                    <section className="workspace-rooms-section card pad">
                        <div className="chart-header">
                            <h3>워크스페이스 채팅방</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>총 {workspaceRooms.length}개</span>
                                <button
                                    onClick={createRoom}
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
                                    title="새 채팅방 생성"
                                >
                                    {roomsLoading ? '⟳' : '+ 채팅방 생성'}
                                </button>
                            </div>
                        </div>
                        {roomsLoading ? (
                            <div className="loading">채팅방 목록을 불러오는 중...</div>
                        ) : workspaceRooms.length > 0 ? (
                            <div className="rooms-list">
                                {workspaceRooms.map((room) => (
                                    <div
                                        key={room.id}
                                        className="room-item"
                                        onClick={() => navigate(`/workspace/${workspaceId}/room/${room.roomId}`)}
                                    >
                                        <div className="room-info">
                                            <div className="room-name">{room.room?.[0]?.title || `Room ${room.roomId}`}</div>
                                            <div className="room-meta">
                                                <span className="room-date">생성일: {formatDate(room.createdAt)}</span>
                                                {room.room?.[0]?.lastMessageId ? (
                                                    <span className="last-message">
                                                        마지막 메시지: {roomMessages[room.room[0].id] || '로딩 중...'}
                                                    </span>
                                                ) : (
                                                    <span className="last-message">
                                                        마지막 메시지: 없음
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="room-arrow">→</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-rooms">
                                <p>생성된 채팅방이 없습니다.</p>
                                <button
                                    onClick={createRoom}
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
                                    title="새 채팅방 생성"
                                >
                                    {roomsLoading ? '⟳' : '첫 번째 채팅방 만들기'}
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Teams Section */}
                    <section className="teams-section card pad">
                        <div className="chart-header">
                            <h3>팀 목록</h3>
                            <div className="header-actions">
                                <span>총 {filteredTeamDetails.length}개</span>
                                <button
                                    className="add-team-btn"
                                    onClick={() => setShowCreateTeamModal(true)}
                                    title="새 팀 생성"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {filteredTeamDetails.length > 0 ? (
                            <div className="teams-grid">
                                {filteredTeamDetails.map((teamDetail) => {
                                    const manager = getMemberProfile(teamDetail.team.managerId);
                                    const isSelected = selectedTeam?.team.id === teamDetail.team.id;
                                    return (
                                        <div
                                            key={teamDetail.team.id}
                                            className={`team-card ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleTeamClick(teamDetail)}
                                        >
                                            <div className="team-content-card-body">
                                                <div className="team-content-card-header">
                                                    <div className="team-name">{teamDetail.team.name}</div>
                                                    <div className="team-manager">
                                                        관리자: {manager?.name || `User ${teamDetail.team.managerId}`}
                                                    </div>
                                                    <div className="team-stats">
                                                        <span>멤버: {teamDetail.members.length}명</span>
                                                        <span>작업: {teamDetail.tasks.length}개</span>
                                                    </div>
                                                </div>
                                                <div className="team-actions">
                                                    <button
                                                        className="dashboard-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/workspace/${workspaceId}/team/${teamDetail.team.id}/dashboard`);
                                                        }}
                                                    >
                                                        대시보드
                                                    </button>
                                                </div>
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
                            <div className="header-actions">
                                <span>{selectedTeam ? `총 ${teamMembers.length}명` : '팀을 선택해주세요'}</span>
                                {selectedTeam && (
                                    <button
                                        className="add-member-btn"
                                        onClick={() => setShowAddTeamMemberModal(true)}
                                        title="팀 멤버 추가"
                                    >
                                        +
                                    </button>
                                )}
                            </div>
                        </div>
                        {selectedTeam ? (
                            teamMembersLoading ? (
                                <div className="loading">팀 멤버를 불러오는 중...</div>
                            ) : teamMembers.length > 0 ? (
                                <div className="team-members-list">
                                    {teamMembers.map((teamMember: any) => {
                                        const profile = teamMember.profile;
                                        const workspaceMember = teamMember.workspaceMember;
                                        const taskCount = getTasksForMember(teamMember.id).length;
                                        const isSelected = selectedMember?.id === teamMember.id;

                                        return (
                                            <div
                                                key={teamMember.id}
                                                className={`team-member-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleMemberClick(teamMember)}
                                            >
                                                <div className="member-avatar">
                                                    {profile?.[0]?.imagePath ? (
                                                        <img
                                                            src={profile[0].imagePath}
                                                            alt={profile[0].name || 'User'}
                                                            className="avatar-image"
                                                        />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {profile?.[0]?.name ? getInitials(profile[0].name) : 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="member-info">
                                                    <div className="member-name">
                                                        {profile?.[0]?.name || `User ${workspaceMember?.userId}`}
                                                    </div>
                                                    <div className="member-role">{teamMember.role}</div>
                                                </div>
                                                <div className="member-actions">
                                                    <span className="member-task-count">
                                                        작업 {taskCount}개
                                                    </span>
                                                    <button
                                                        className="remove-member-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveTeamMember(teamMember.id);
                                                        }}
                                                        title="팀에서 제거"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="no-members">
                                    <p>팀에 멤버가 없습니다.</p>
                                    <button
                                        className="add-first-member-btn"
                                        onClick={() => setShowAddTeamMemberModal(true)}
                                    >
                                        첫 번째 멤버 추가하기
                                    </button>
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
                                    <p className="active">{selectedMember.user?.name || '멤버'}의 작업 목록</p>
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

                {/* Add Member Modal */}
                {showAddMemberModal && (
                    <div className="modal-overlay" style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}>
                        <div className="modal-content" style={{
                            backgroundColor: 'white',
                            padding: '24px',
                            borderRadius: '8px',
                            width: '400px',
                            maxWidth: '90vw'
                        }}>
                            <h3 style={{ marginBottom: '20px', color: '#333' }}>새 멤버 추가</h3>

                            <form onSubmit={handleAddMember}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        사용자 ID *
                                    </label>
                                    <input
                                        type="number"
                                        value={newMemberData.userId || ''}
                                        onChange={(e) => handleMemberFormChange('userId', parseInt(e.target.value) || 0)}
                                        placeholder="추가할 사용자의 ID를 입력하세요"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                        역할 *
                                    </label>
                                    <select
                                        value={newMemberData.role}
                                        onChange={(e) => handleMemberFormChange('role', e.target.value as any)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="VIEWER">Viewer</option>
                                        <option value="MEMBER">Member</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddMemberModal(false);
                                            setNewMemberData({ userId: 0, role: "MEMBER" });
                                        }}
                                        disabled={addingMember}
                                        style={{
                                            padding: '8px 16px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            backgroundColor: 'white',
                                            cursor: addingMember ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addingMember || !newMemberData.userId}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: newMemberData.userId ? '#28a745' : '#ccc',
                                            color: 'white',
                                            cursor: (addingMember || !newMemberData.userId) ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {addingMember ? '추가 중...' : '추가'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Activity Log Modal */}
                {showActivityLogModal && (
                    <div className="modal-overlay" onClick={() => setShowActivityLogModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>새 활동 로그 작성</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowActivityLogModal(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleAddActivityLog}>
                                <div className="form-group">
                                    <label htmlFor="activityMessage">활동 내용</label>
                                    <textarea
                                        id="activityMessage"
                                        value={newActivityLog.message}
                                        onChange={(e) => setNewActivityLog({
                                            ...newActivityLog,
                                            message: e.target.value
                                        })}
                                        placeholder="활동 내용을 입력하세요..."
                                        required
                                        rows={4}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            resize: 'vertical',
                                            minHeight: '80px'
                                        }}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowActivityLogModal(false);
                                            setNewActivityLog({ message: '' });
                                        }}
                                        disabled={addingActivityLog}
                                        style={{
                                            padding: '8px 16px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            backgroundColor: 'white',
                                            cursor: addingActivityLog ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addingActivityLog || !newActivityLog.message.trim()}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: newActivityLog.message.trim() ? '#28a745' : '#ccc',
                                            color: 'white',
                                            cursor: (addingActivityLog || !newActivityLog.message.trim()) ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {addingActivityLog ? '작성 중...' : '작성'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Team Creation Modal */}
                {showCreateTeamModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>새 팀 생성</h3>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() => {
                                        setShowCreateTeamModal(false);
                                        setNewTeamData({ name: '' });
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleCreateTeam();
                            }}>
                                <div className="form-group">
                                    <label htmlFor="teamName">팀 이름</label>
                                    <input
                                        type="text"
                                        id="teamName"
                                        value={newTeamData.name}
                                        onChange={(e) => handleTeamFormChange('name', e.target.value)}
                                        placeholder="팀 이름을 입력하세요..."
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateTeamModal(false);
                                            setNewTeamData({ name: '' });
                                        }}
                                        disabled={creatingTeam}
                                        style={{
                                            padding: '8px 16px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            backgroundColor: 'white',
                                            cursor: creatingTeam ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingTeam || !newTeamData.name.trim()}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: newTeamData.name.trim() ? '#28a745' : '#ccc',
                                            color: 'white',
                                            cursor: (creatingTeam || !newTeamData.name.trim()) ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {creatingTeam ? '생성 중...' : '생성'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Team Member Add Modal */}
                {showAddTeamMemberModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>팀 멤버 추가</h3>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() => {
                                        setShowAddTeamMemberModal(false);
                                        setNewTeamMemberData({ memberId: 0, role: "MEMBER" });
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleAddTeamMember();
                            }}>
                                <div className="form-group">
                                    <label htmlFor="memberId">워크스페이스 멤버</label>
                                    <select
                                        id="memberId"
                                        value={newTeamMemberData.memberId}
                                        onChange={(e) => handleTeamMemberFormChange('memberId', Number(e.target.value))}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value={0}>멤버를 선택하세요</option>
                                        {members
                                            .filter(member => !teamMembers.some(tm => tm.memberId === member.id))
                                            .map(member => {
                                                const profile = getMemberProfile(member.userId);
                                                return (
                                                    <option key={member.id} value={member.id}>
                                                        {profile?.name || `User ${member.userId}`} ({member.role})
                                                    </option>
                                                );
                                            })
                                        }
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="memberRole">팀 역할</label>
                                    <select
                                        id="memberRole"
                                        value={newTeamMemberData.role}
                                        onChange={(e) => handleTeamMemberFormChange('role', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="MEMBER">Member</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="VIEWER">Viewer</option>
                                    </select>
                                </div>
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddTeamMemberModal(false);
                                            setNewTeamMemberData({ memberId: 0, role: "MEMBER" });
                                        }}
                                        disabled={addingTeamMember}
                                        style={{
                                            padding: '8px 16px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            backgroundColor: 'white',
                                            cursor: addingTeamMember ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addingTeamMember || !newTeamMemberData.memberId}
                                        style={{
                                            padding: '8px 16px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: newTeamMemberData.memberId ? '#28a745' : '#ccc',
                                            color: 'white',
                                            cursor: (addingTeamMember || !newTeamMemberData.memberId) ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {addingTeamMember ? '추가 중...' : '추가'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Role Management Modal */}
                {showRoleModal && selectedMemberForRole && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>역할 변경</h3>
                                <button
                                    type="button"
                                    className="modal-close"
                                    onClick={() => {
                                        setShowRoleModal(false);
                                        setSelectedMemberForRole(null);
                                        setNewRole('');
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: '#666'
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            <div style={{ padding: '20px 0' }}>
                                <p style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
                                    <strong>{getMemberProfile(selectedMemberForRole.userId)?.name || `User ${selectedMemberForRole.userId}`}</strong>의 역할을 변경합니다.
                                </p>
                                <div className="form-group">
                                    <label htmlFor="newRole">새 역할</label>
                                    <select
                                        id="newRole"
                                        value={newRole}
                                        onChange={(e) => setNewRole(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    >
                                        <option value="ADMIN">관리자 (ADMIN)</option>
                                        <option value="MANAGER">매니저 (MANAGER)</option>
                                        <option value="MEMBER">멤버 (MEMBER)</option>
                                        <option value="VIEWER">뷰어 (VIEWER)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRoleModal(false);
                                        setSelectedMemberForRole(null);
                                        setNewRole('');
                                    }}
                                    disabled={updatingRole}
                                    style={{
                                        padding: '8px 16px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: 'white',
                                        cursor: updatingRole ? 'not-allowed' : 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateRole}
                                    disabled={updatingRole || !newRole || newRole === selectedMemberForRole.role}
                                    style={{
                                        padding: '8px 16px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        backgroundColor: (updatingRole || !newRole || newRole === selectedMemberForRole.role) ? '#ccc' : '#28a745',
                                        color: 'white',
                                        cursor: (updatingRole || !newRole || newRole === selectedMemberForRole.role) ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}
                                >
                                    {updatingRole ? '변경 중...' : '변경'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <Footer />
        </>
    );
}

export default Workspace;
