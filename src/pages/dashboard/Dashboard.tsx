import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardService from "../../api/dashboard/route";
import AttendanceService from "../../api/user/Attendance";
import WorkspaceServer from "../../api/workspace/workspace";
import RoomsService from "../../api/user/rooms/rooms";
import AuthServer from "../../api/auth/auth";
import { DashboardData, CalendarDay, MonthData } from "../../interface/Dashboard";
import { WorkspaceCreateRequest } from "../../interface/Workspace";
import Footer from "../../components/Footer";
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [attendanceStatus, setAttendanceStatus] = useState<boolean | null>(null);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
    const [attendanceRecordsState, setAttendanceRecordsState] = useState<any[]>([]);
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
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        DashboardService.Getdashboard().then((res) => {
            setDashboardData(res.data);
            setLoading(false);
        }).catch((error) => {
            console.error("Dashboard data fetch error:", error);
            setLoading(false);
        });

        // Check attendance status
        checkAttendanceStatus();
    }, []);

    // Handle click outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowUserDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const checkAttendanceStatus = async () => {
        try {
            const response = await AttendanceService.AttendanceGet();
            setAttendanceRecordsState(response.data);

            // Check if user has attended today
            const today = new Date().toDateString();
            const hasAttendedToday = response.data.some((record: any) =>
                new Date(record.createdAt).toDateString() === today
            );
            setAttendanceStatus(hasAttendedToday);
        } catch (error) {
            console.error("Failed to check attendance status:", error);
            setAttendanceStatus(false);
            setAttendanceRecordsState([]);
        }
    };

    const handleAttendance = async () => {
        if (attendanceStatus) return; // Already attended today

        setIsAttendanceLoading(true);
        try {
            await AttendanceService.AttendanceCreate();
            setAttendanceStatus(true);

            // Update attendance records to reflect the new attendance
            const today = new Date();
            const newAttendanceRecord = {
                id: Date.now(), // Temporary ID
                createdAt: today.toISOString(),
                userId: dashboardData?.user?.id
            };
            setAttendanceRecordsState(prevRecords => [...prevRecords, newAttendanceRecord]);
        } catch (error) {
            console.error("Failed to create attendance:", error);
        } finally {
            setIsAttendanceLoading(false);
        }
    };

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
                    } catch (error: any) {
                        if (error.response?.status === 401) {
                            names[workspaceId] = `워크스페이스 ${workspaceId}`
                            continue;
                        }
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

    const handleLogout = async () => {
        try {
            await AuthServer.Logout();
            navigate("/auth/login");
        } catch (error) {
            console.error("Logout failed:", error);
            // Even if logout API fails, redirect to login page
            navigate("/auth/login");
        }
    };

    const toggleUserDropdown = () => {
        setShowUserDropdown(!showUserDropdown);
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
        let filteredLogs = logs;
        
        // 필터링 적용
        if (activityFilter.trim()) {
            filteredLogs = logs.filter(log =>
                log.message.toLowerCase().includes(activityFilter.toLowerCase()) ||
                (workspaceNames[log.workspaceId] && workspaceNames[log.workspaceId].toLowerCase().includes(activityFilter.toLowerCase()))
            );
        }
        
        // 최신 순으로 정렬 (createdAt 기준 내림차순)
        return filteredLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

        const monthlyAttendance = attendanceRecordsState.filter(record => {
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
        return attendanceRecordsState.some(record =>
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

    const generateMonthlyCalendar = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const attendedDates = new Set(
            attendanceRecordsState.map(record => {
                const recordDate = new Date(record.createdAt);
                if (recordDate.getFullYear() === year && recordDate.getMonth() === month) {
                    return recordDate.getDate();
                }
                return null;
            }).filter(Boolean)
        );

        const weeks = [];
        let currentWeek = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            currentWeek.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            );
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate();
            const isAttended = attendedDates.has(day);
            const isPast = day < today.getDate();

            let level = 0;
            if (isAttended) {
                level = 4; // Maximum intensity for attended days
            }

            currentWeek.push(
                <div
                    key={day}
                    className={`calendar-day level-${level} ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
                    title={`${year}년 ${month + 1}월 ${day}일${isAttended ? ' - 출석함' : isPast ? ' - 출석안함' : ''}`}
                >
                    <span className="day-number">{day}</span>
                </div>
            );

            // If we've filled a week (7 days) or reached the end of the month
            if (currentWeek.length === 7) {
                weeks.push(
                    <div key={`week-${weeks.length}`} className="calendar-week">
                        {currentWeek}
                    </div>
                );
                currentWeek = [];
            }
        }

        // Add remaining empty cells to complete the last week
        while (currentWeek.length > 0 && currentWeek.length < 7) {
            currentWeek.push(
                <div key={`empty-end-${currentWeek.length}`} className="calendar-day empty"></div>
            );
        }

        if (currentWeek.length > 0) {
            weeks.push(
                <div key={`week-${weeks.length}`} className="calendar-week">
                    {currentWeek}
                </div>
            );
        }

        return weeks;
    };

    const attendanceStats = calculateAttendanceRate();
    const sortedWorkspaces = sortWorkspaces(flatWorkspaces);
    const sortedRooms = sortRooms(flatRooms.filter(room => room.type === 'DM'));
    const filteredActivityLogs = filterActivityLogs(activityLog);

    return (
        <>
            <div className="dashboard">
                <div className="topbar">
                    <div className="title">Dashboard</div>
                    <div className="spacer"></div>
                    <div className="user-info-dashboard" ref={dropdownRef}>
                        <div className="avatar" title={profile.name} onClick={toggleUserDropdown}>
                            {profile.imagePath ? (
                                <img src={profile.imagePath} alt={profile.name} />
                            ) : (
                                <div className="dropdown-avatar-placeholder">
                                    {getInitials(profile.name)}
                                </div>
                            )}
                        </div>
                        {showUserDropdown && (
                            <div className="user-dropdown">
                                <div className="dropdown-header">
                                    <div className="dropdown-avatar">
                                        {profile.imagePath ? (
                                            <img src={profile.imagePath} alt={profile.name} />
                                        ) : (
                                            <div className="dropdown-avatar-placeholder">
                                                {getInitials(profile.name)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="dropdown-user-info">
                                        <div className="dropdown-name">{profile.name}</div>
                                        <div className="dropdown-email">{user.email}</div>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-menu">
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate('/user/profile');
                                            setShowUserDropdown(false);
                                        }}
                                    >
                                        <span className="dropdown-icon">⚙️</span>
                                        프로필 설정
                                    </button>
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            navigate('/user/profile');
                                            setShowUserDropdown(false);
                                        }}
                                    >
                                        <span className="dropdown-icon">👤</span>
                                        내 정보
                                    </button>
                                    <div className="dropdown-divider"></div>
                                    <button
                                        className="dropdown-item logout-item"
                                        onClick={() => {
                                            handleLogout();
                                            setShowUserDropdown(false);
                                        }}
                                    >
                                        <span className="dropdown-icon">🚪</span>
                                        로그아웃
                                    </button>
                                </div>
                            </div>
                        )}
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
                        <div className="profile-card-content">
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
                            <div className="profile-card-actions">
                                <button
                                    className="profile-action-btn settings-btn"
                                    onClick={() => navigate('/user/profile')}
                                >
                                    ⚙️ 프로필 설정
                                </button>
                                <button
                                    className={`profile-action-btn attendance-btn ${attendanceStatus ? 'attended' : ''}`}
                                    onClick={handleAttendance}
                                    disabled={isAttendanceLoading || (attendanceStatus === true)}
                                >
                                    {isAttendanceLoading ? (
                                        '처리 중...'
                                    ) : attendanceStatus ? (
                                        '✅ 출석 완료'
                                    ) : (
                                        '📝 출석하기'
                                    )}
                                </button>
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
                            <div className="summary-card-subtitle">{attendanceStats.attended}번 중 {attendanceStats.total}일 출석</div>
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
                                                <span className="stat-value-new">{attendanceRecordsState.length}</span>
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
                                                const attended = attendanceRecordsState.some(record =>
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

                                    {/* Monthly Attendance Calendar - GitHub Style */}
                                    <div className="monthly-attendance-calendar">
                                        <h4>이번 달 출석 현황</h4>
                                        <div className="calendar-container">
                                            <div className="calendar-grid">
                                                {generateMonthlyCalendar()}
                                            </div>
                                            <div className="calendar-legend">
                                                <span className="legend-text">적음</span>
                                                <div className="legend-squares">
                                                    <div className="legend-square level-0"></div>
                                                    <div className="legend-square level-1"></div>
                                                    <div className="legend-square level-2"></div>
                                                    <div className="legend-square level-3"></div>
                                                    <div className="legend-square level-4"></div>
                                                </div>
                                                <span className="legend-text">많음</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attendance Records */}
                                    <div className="attendance-records">
                                        <h4>최근 출석 기록</h4>
                                        <div className="records-list">
                                            {attendanceRecordsState
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
            <Footer />
        </>
    );
}