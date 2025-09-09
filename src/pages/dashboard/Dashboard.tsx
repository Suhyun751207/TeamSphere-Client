import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardService from "../../api/dashboard/route";
import AttendanceService from "../../api/user/Attendance";
import WorkspaceServer from "../../api/workspace/workspace";
import RoomsService from "../../api/user/rooms/rooms";
import { DashboardData, CalendarDay, MonthData } from "../../interface/Dashboard";
import { WorkspaceCreateRequest } from "../../interface/Workspace";
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    const [workspaceNames, setWorkspaceNames] = useState<{ [key: number]: string }>({});
    const [lastMessages, setLastMessages] = useState<{ [key: number]: string }>({});
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [workspaceFormData, setWorkspaceFormData] = useState<WorkspaceCreateRequest>({
        name: '',
        description: ''
    });

    // New state for enhanced dashboard
    const [activeTab, setActiveTab] = useState<'activity' | 'attendance'>('activity');
    const [activityFilter, setActivityFilter] = useState<string>('');
    const [workspaceSortBy, setWorkspaceSortBy] = useState<'latest' | 'alphabetical' | 'active'>('latest');
    const [roomsSortBy, setRoomsSortBy] = useState<'latest' | 'alphabetical' | 'active'>('latest');
    const [showAttendanceReminder, setShowAttendanceReminder] = useState(false);

    useEffect(() => {
        DashboardService.Getdashboard().then((res) => {
            setDashboardData(res.data);
            setLoading(false);
        }).catch((error) => {
            console.error("Dashboard data fetch error:", error);
            setLoading(false);
        });
    }, []);

    // 워크스페이스 이름 가져오기
    useEffect(() => {
        if (dashboardData?.activityLog) {
            const uniqueWorkspaceIds = Array.from(new Set(dashboardData.activityLog.map(log => log.workspaceId)));

            const fetchWorkspaceNames = async () => {
                const names: { [key: number]: string } = {};

                for (const workspaceId of uniqueWorkspaceIds) {
                    try {
                        const response = await WorkspaceServer.WorkspaceDetail(workspaceId);
                        names[workspaceId] = response.data.workspace[0].name;
                    } catch (error) {
                        console.error(`Failed to fetch workspace ${workspaceId}:`, error);
                        names[workspaceId] = `워크스페이스 ${workspaceId}`;
                    }
                }

                setWorkspaceNames(names);
            };

            fetchWorkspaceNames();
        }
    }, [dashboardData]);

    // 마지막 메시지 내용 가져오기
    useEffect(() => {
        if (dashboardData?.rooms) {
            const flatRooms = dashboardData.rooms.flat();
            const roomsWithMessages = flatRooms.filter(room => room.lastMessageId);

            const fetchLastMessages = async () => {
                const messages: { [key: number]: string } = {};

                for (const room of roomsWithMessages) {
                    if (room.lastMessageId) {
                        try {
                            const response = await RoomsService.MessageSelect(room.id, room.lastMessageId);
                            messages[room.id] = response.data.content;
                        } catch (error) {
                            console.error(`Failed to fetch message for room ${room.id}:`, error);
                            messages[room.id] = '메시지를 불러올 수 없습니다';
                        }
                    }
                }

                setLastMessages(messages);
            };

            fetchLastMessages();
        }
    }, [dashboardData]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!dashboardData) {
        return <div className="error">Failed to load dashboard data</div>;
    }

    const { user, profile, activityLog, attendanceRecords, rooms, workspaces } = dashboardData;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handleRoomClick = (roomId: number) => {
        navigate(`/user/rooms/${roomId}`);
    };

    const handleWorkspaceClick = (workspaceId: number) => {
        navigate(`/workspace/${workspaceId}`);
    };

    const createRoom = async () => {
        try {
            setLoading(true);
            await RoomsService.RoomsCreate();

            // Refresh dashboard data to show new room
            const res = await DashboardService.Getdashboard();
            setDashboardData(res.data);

            alert("방 생성 완료");
        } catch (err) {
            console.error('Failed to create room:', err);
            alert('방 생성에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const createWorkspace = async () => {
        try {
            setLoading(true);
            await WorkspaceServer.WorkspaceCreate(workspaceFormData);

            // Refresh dashboard data to show new workspace
            const res = await DashboardService.Getdashboard();
            setDashboardData(res.data);

            // Reset form and close modal
            setWorkspaceFormData({ name: '', description: '' });
            setShowWorkspaceModal(false);

            alert("워크스페이스 생성 완료");
        } catch (err) {
            console.error('Failed to create workspace:', err);
            alert('워크스페이스 생성에 실패했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleWorkspaceFormChange = (field: keyof WorkspaceCreateRequest, value: string) => {
        setWorkspaceFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Flatten arrays for easier processing
    const flatRooms = rooms.flat();
    const flatWorkspaces = workspaces.flat();

    // Helper functions for sorting and filtering
    const sortWorkspaces = (workspaces: any[]) => {
        switch (workspaceSortBy) {
            case 'alphabetical':
                return [...workspaces].sort((a, b) => a.name.localeCompare(b.name));
            case 'active':
                return [...workspaces].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
            case 'latest':
            default:
                return [...workspaces].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    };

    const sortRooms = (rooms: any[]) => {
        switch (roomsSortBy) {
            case 'alphabetical':
                return [...rooms].sort((a, b) => (a.title || `Room ${a.id}`).localeCompare(b.title || `Room ${b.id}`));
            case 'active':
                return [...rooms].sort((a, b) => (b.lastMessageId || 0) - (a.lastMessageId || 0));
            case 'latest':
            default:
                return [...rooms].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
    };

    const filterActivityLogs = (logs: any[]) => {
        if (!activityFilter.trim()) return logs;
        return logs.filter(log =>
            log.message.toLowerCase().includes(activityFilter.toLowerCase()) ||
            (workspaceNames[log.workspaceId] && workspaceNames[log.workspaceId].toLowerCase().includes(activityFilter.toLowerCase()))
        );
    };

    const getActivityIcon = (message: string) => {
        if (message.includes('생성') || message.includes('추가')) return '✅';
        if (message.includes('삭제') || message.includes('제거')) return '❌';
        if (message.includes('수정') || message.includes('업데이트')) return '✏️';
        if (message.includes('로그인') || message.includes('접속')) return '🔑';
        return '📝';
    };

    const getActivityColor = (message: string) => {
        if (message.includes('생성') || message.includes('추가') || message.includes('성공')) return 'success';
        if (message.includes('삭제') || message.includes('제거') || message.includes('오류') || message.includes('실패')) return 'danger';
        if (message.includes('수정') || message.includes('업데이트')) return 'warning';
        return 'general';
    };

    const calculateAttendanceRate = () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();

        const monthlyAttendance = attendanceRecords.filter(record => {
            const recordDate = new Date(record.createdAt);
            return recordDate >= startOfMonth && recordDate <= today;
        });

        return {
            attended: monthlyAttendance.length,
            total: currentDay,
            percentage: Math.round((monthlyAttendance.length / currentDay) * 100)
        };
    };

    // Attendance calendar functions
    const isAlreadyAttended = () => {
        const today = new Date().toDateString();
        return attendanceRecords.some(record =>
            new Date(record.createdAt).toDateString() === today
        );
    };

    const handleAttendanceCheck = async () => {
        if (isAlreadyAttended()) return;

        setIsAttendanceLoading(true);
        try {
            await AttendanceService.AttendanceCreate();

            // Refresh dashboard data to update attendance records
            const res = await DashboardService.Getdashboard();
            setDashboardData(res.data);
        } catch (error) {
            console.error('Attendance check failed:', error);
        } finally {
            setIsAttendanceLoading(false);
        }
    };

    const generateMonthlyCalendarData = (): MonthData[] => {
        const today = new Date();
        const todayStr = today.toDateString();
        const attendedDates = new Set(
            attendanceRecords.map(record => new Date(record.createdAt).toDateString())
        );

        const months: MonthData[] = [];
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

        // Get user signup date
        const signupDate = new Date(user.createdAt);
        const signupYear = signupDate.getFullYear();
        const signupMonth = signupDate.getMonth();

        // Calculate end date (next month from current month)
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const endYear = nextMonth.getFullYear();
        const endMonth = nextMonth.getMonth();

        // Generate months from signup month to next month
        let currentYear = signupYear;
        let currentMonth = signupMonth;

        while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
            // Get first and last day of the month
            const firstDay = new Date(currentYear, currentMonth, 1);
            const lastDay = new Date(currentYear, currentMonth + 1, 0);

            const days: CalendarDay[] = [];

            // Add empty days for the beginning of the month (to align with weekdays)
            const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
            for (let j = 0; j < firstDayOfWeek; j++) {
                days.push({
                    date: '',
                    attended: false,
                    isToday: false,
                    isEmpty: true
                });
            }

            // Add all days of the month
            const current = new Date(firstDay);
            while (current <= lastDay) {
                const dateStr = current.toDateString();
                const isValidDate = current <= today;

                days.push({
                    date: current.getDate().toString(),
                    attended: isValidDate && attendedDates.has(dateStr),
                    isToday: dateStr === todayStr,
                    isEmpty: false
                });

                current.setDate(current.getDate() + 1);
            }

            months.push({
                year: currentYear,
                month: currentMonth,
                monthName: monthNames[currentMonth],
                days
            });

            // Move to next month
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
        }

        return months;
    };

    const attendanceStats = calculateAttendanceRate();
    const sortedWorkspaces = sortWorkspaces(flatWorkspaces);
    const sortedRooms = sortRooms(flatRooms.filter(room => room.type === 'DM'));
    const filteredActivityLogs = filterActivityLogs(activityLog);

    return (
        <div className="dashboard">
            <div className="topbar">
                <div className="title">Dashboard</div>
                <div className="spacer"></div>
                <div className="user-info">
                    <div className="avatar" title={profile.name}>
                        {getInitials(profile.name)}
                    </div>
                </div>
            </div>

            {/* Summary Cards Section */}
            <div className="summary-cards">
                <div className="profile-card-full">
                    <div className="profile-card-header">
                        <div className="profile-card-avatar">
                            {profile.imagePath ? (
                                <img
                                    src={profile.imagePath}
                                    alt={profile.name}
                                    loading="eager"
                                    decoding="sync"
                                />
                            ) : (
                                <div className="profile-avatar-placeholder">
                                    {getInitials(profile.name)}
                                </div>
                            )}
                        </div>
                        <div className="profile-card-basic">
                            <div className="profile-card-name">{profile.name}</div>
                            <div className="profile-card-email">{user.email}</div>
                            <div className="profile-card-contact">{profile.phone}</div>
                            {profile.subscriptionState !== 'MEMBER' && (
                                <span className={`profile-role-badge ${profile.subscriptionState.toLowerCase()}`}>
                                    {profile.subscriptionState}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="profile-card-details">
                        <div className="profile-detail-row">
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">User ID</span>
                                <span className="profile-detail-value">#{user.id}</span>
                            </div>
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">Age</span>
                                <span className="profile-detail-value">{profile.age}세</span>
                            </div>
                        </div>
                        <div className="profile-detail-row">
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">Gender</span>
                                <span className="profile-detail-value">
                                    {profile.gender === 'PRIVATE' ? '비공개' : profile.gender}
                                </span>
                            </div>
                            <div className="profile-detail-item">
                                <span className="profile-detail-label">Join Date</span>
                                <span className="profile-detail-value">{formatDate(user.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="summary-cards-div">
                    <div className="summary-card">
                        <div className="summary-card-icon workspace-icon">🏢</div>
                        <div className="summary-card-content">
                            <div className="summary-card-title">워크스페이스</div>
                            <div className="summary-card-value">{flatWorkspaces.length}</div>
                            <div className="summary-card-subtitle">참여 중인 워크스페이스</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-card-icon chat-icon">💬</div>
                        <div className="summary-card-content">
                            <div className="summary-card-title">채팅방</div>
                            <div className="summary-card-value">{sortedRooms.length}</div>
                            <div className="summary-card-subtitle">활성 채팅방</div>
                        </div>
                    </div>

                    <div className="summary-card">
                        <div className="summary-card-icon activity-icon">📊</div>
                        <div className="summary-card-content">
                            <div className="summary-card-title">활동 로그</div>
                            <div className="summary-card-value">{activityLog.length}</div>
                            <div className="summary-card-subtitle">총 활동 기록</div>
                        </div>
                    </div>
                </div>
                <div className="summary-card">
                    <div className="summary-card-icon attendance-icon">📅</div>
                    <div className="summary-card-content">
                        <div className="summary-card-title">이번 달 출석률</div>
                        <div className="summary-card-value">{attendanceStats.percentage}%</div>
                        <div className="summary-card-subtitle">{attendanceStats.attended}/{attendanceStats.total}일 출석</div>
                        <div className="attendance-progress">
                            <div
                                className="attendance-progress-bar"
                                style={{ width: `${attendanceStats.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="main-content">
                {/* Left Column */}
                <div className="left-column">
                    {/* Workspace Section */}
                    <section className="content-card">
                        <div className="content-card-header">
                            <div className="content-card-title">
                                <span className="card-icon">🏢</span>
                                워크스페이스
                            </div>
                            <div className="content-card-actions">
                                <select
                                    value={workspaceSortBy}
                                    onChange={(e) => setWorkspaceSortBy(e.target.value as any)}
                                    className="sort-select"
                                >
                                    <option value="latest">최신순</option>
                                    <option value="alphabetical">이름순</option>
                                    <option value="active">활동순</option>
                                </select>
                                <button
                                    onClick={() => setShowWorkspaceModal(true)}
                                    className="action-btn primary"
                                    disabled={loading}
                                >
                                    <span>+</span>
                                </button>
                            </div>
                        </div>
                        <div className="workspace-grid">
                            {sortedWorkspaces.map((workspace) => (
                                <div
                                    key={workspace.id}
                                    className="workspace-card"
                                    onClick={() => handleWorkspaceClick(workspace.id)}
                                >
                                    <div className="workspace-card-icon">🏢</div>
                                    <div className="workspace-card-content">
                                        <div className="workspace-card-name">{workspace.name}</div>
                                        <div className="workspace-card-desc">{workspace.description}</div>
                                        <div className="workspace-card-date">{formatDate(workspace.createdAt)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Rooms Section */}
                    <section className="content-card">
                        <div className="content-card-header">
                            <div className="content-card-title">
                                <span className="card-icon">💬</span>
                                채팅방
                            </div>
                            <div className="content-card-actions">
                                <select
                                    value={roomsSortBy}
                                    onChange={(e) => setRoomsSortBy(e.target.value as any)}
                                    className="sort-select"
                                >
                                    <option value="latest">최신순</option>
                                    <option value="alphabetical">이름순</option>
                                    <option value="active">활동순</option>
                                </select>
                                <button
                                    onClick={createRoom}
                                    className="action-btn primary"
                                    disabled={loading}
                                >
                                    <span>+</span>
                                </button>
                            </div>
                        </div>
                        <div className="rooms-grid">
                            {sortedRooms.map((room) => (
                                <div
                                    key={room.id}
                                    className="room-card"
                                    onClick={() => handleRoomClick(room.id)}
                                >
                                    <div className="room-card-icon">💬</div>
                                    <div className="room-card-content">
                                        <div className="room-card-title">{room.title || `Room ${room.id}`}</div>
                                        <div className="room-card-type">{room.type}</div>
                                        <div className="room-card-message">
                                            {room.lastMessageId
                                                ? (lastMessages[room.id] || '메시지 로딩 중...')
                                                : '메시지 없음'
                                            }
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column */}
                <div className="right-column">
                    {/* Tabbed Content */}
                    <section className="content-card tabbed-card">
                        <div className="tab-header">
                            <button
                                className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                                onClick={() => setActiveTab('activity')}
                            >
                                📊 활동 로그
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
                                onClick={() => setActiveTab('attendance')}
                            >
                                📅 출석 기록
                            </button>
                        </div>

                        {activeTab === 'activity' && (
                            <div className="tab-content">
                                <div className="activity-controls">
                                    <div className="search-box">
                                        <input
                                            type="text"
                                            placeholder="활동 로그 검색..."
                                            value={activityFilter}
                                            onChange={(e) => setActivityFilter(e.target.value)}
                                            className="search-input"
                                        />
                                        <span className="search-icon">🔍</span>
                                    </div>
                                    <span className="activity-count">{filteredActivityLogs.length}개 활동</span>
                                </div>

                                <div className="activity-list">
                                    {filteredActivityLogs.map((log, index) => (
                                        <div key={index} className="activity-item">
                                            <div className={`activity-icon ${getActivityColor(log.message)}`}>
                                                {getActivityIcon(log.message)}
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-message">{log.message}</div>
                                                <div className="activity-workspace">
                                                    {workspaceNames[log.workspaceId] || `워크스페이스 ${log.workspaceId}`}
                                                </div>
                                                <div className="activity-date">{formatDate(log.createdAt)}</div>
                                            </div>
                                            <div className="activity-actions">
                                                <button className="action-btn ghost" title="복사">📋</button>
                                                <button className="action-btn ghost" title="상세보기">👁️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'attendance' && (
                            <div className="tab-content">
                                <div className="attendance-header-new">
                                    <div className="attendance-stats-new">
                                        <div className="stat-item-new">
                                            <span className="stat-value-new">{attendanceRecords.length}</span>
                                            <span className="stat-label-new">총 출석일</span>
                                        </div>
                                        <div className="stat-item-new">
                                            <span className="stat-value-new">{attendanceStats.percentage}%</span>
                                            <span className="stat-label-new">이번 달</span>
                                        </div>
                                    </div>
                                    <div className="attendance-actions-new">
                                        <button
                                            className={`attendance-btn-new ${isAlreadyAttended() ? 'completed' : 'primary'}`}
                                            onClick={handleAttendanceCheck}
                                            disabled={isAttendanceLoading || isAlreadyAttended()}
                                        >
                                            {isAttendanceLoading ? '⏳' : isAlreadyAttended() ? '✅ 출석완료' : '📝 출석하기'}
                                        </button>
                                        {!isAlreadyAttended() && (
                                            <button
                                                className="reminder-btn"
                                                onClick={() => setShowAttendanceReminder(true)}
                                                title="출석 알림 설정"
                                            >
                                                🔔
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Weekly Heatmap */}
                                <div className="weekly-heatmap">
                                    <h4>주간 출석 현황</h4>
                                    <div className="heatmap-grid">
                                        {Array.from({ length: 7 }, (_, i) => {
                                            const date = new Date();
                                            date.setDate(date.getDate() - (6 - i));
                                            const dateStr = date.toDateString();
                                            const attended = attendanceRecords.some(record =>
                                                new Date(record.createdAt).toDateString() === dateStr
                                            );
                                            return (
                                                <div
                                                    key={i}
                                                    className={`heatmap-day ${attended ? 'attended' : 'not-attended'}`}
                                                    title={`${date.toLocaleDateString('ko-KR')}: ${attended ? '출석함' : '출석안함'}`}
                                                >
                                                    <div className="day-label">{['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}</div>
                                                    <div className="day-circle"></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Attendance Records */}
                                <div className="attendance-records">
                                    <h4>최근 출석 기록</h4>
                                    <div className="records-list">
                                        {attendanceRecords
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                            .slice(0, 5)
                                            .map((record) => (
                                                <div key={record.id} className="record-item">
                                                    <div className="record-icon">✅</div>
                                                    <div className="record-content">
                                                        <div className="record-date">{formatDate(record.createdAt)}</div>
                                                        <div className="record-time">
                                                            {new Date(record.createdAt).toLocaleTimeString('ko-KR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Attendance Reminder Modal */}
            {showAttendanceReminder && (
                <div className="modal-overlay">
                    <div className="modal-content reminder-modal">
                        <h3>출석 알림 설정</h3>
                        <p>매일 정해진 시간에 출석 알림을 받으시겠습니까?</p>
                        <div className="reminder-options">
                            <button className="action-btn secondary" onClick={() => setShowAttendanceReminder(false)}>
                                나중에
                            </button>
                            <button className="action-btn primary" onClick={() => {
                                alert('출석 알림이 설정되었습니다!');
                                setShowAttendanceReminder(false);
                            }}>
                                알림 설정
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Workspace Creation Modal */}
            {showWorkspaceModal && (
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
                        <h3 style={{ marginBottom: '20px', color: '#333' }}>새 워크스페이스 생성</h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                워크스페이스 이름 *
                            </label>
                            <input
                                type="text"
                                value={workspaceFormData.name}
                                onChange={(e) => handleWorkspaceFormChange('name', e.target.value)}
                                placeholder="워크스페이스 이름을 입력하세요"
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
                                설명
                            </label>
                            <textarea
                                value={workspaceFormData.description}
                                onChange={(e) => handleWorkspaceFormChange('description', e.target.value)}
                                placeholder="워크스페이스 설명을 입력하세요"
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowWorkspaceModal(false);
                                    setWorkspaceFormData({ name: '', description: '' });
                                }}
                                disabled={loading}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    backgroundColor: 'white',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={createWorkspace}
                                disabled={loading || !workspaceFormData.name.trim()}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    backgroundColor: workspaceFormData.name.trim() ? '#28a745' : '#ccc',
                                    color: 'white',
                                    cursor: (loading || !workspaceFormData.name.trim()) ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500'
                                }}
                            >
                                {loading ? '생성 중...' : '생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}