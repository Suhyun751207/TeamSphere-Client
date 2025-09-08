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

            <div className="grid">
                {/* User Profile Section */}
                <section className="profile-section card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {profile.imagePath ? (
                                <img
                                    src={profile.imagePath}
                                    alt={profile.name}
                                    loading="eager"
                                    decoding="sync"
                                    style={{
                                        imageRendering: 'auto'
                                    }}
                                />
                            ) : (
                                <div className="avatar-placeholder">
                                    {getInitials(profile.name)}
                                </div>
                            )}
                        </div>
                        <div className="profile-basic-info">
                            <h2 className="profile-name">{profile.name}</h2>
                            <p className="profile-email">{user.email}</p>
                            <div className="profile-status">
                                <span className={`status-badge ${profile.subscriptionState.toLowerCase()}`}>
                                    {profile.subscriptionState}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="profile-info-grid">
                            <div className="info-item">
                                <div className="info-label">사용자 ID</div>
                                <div className="info-value">#{user.id}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">가입일</div>
                                <div className="info-value">{formatDate(user.createdAt)}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">이메일</div>
                                <div className="info-value">{user.email}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">연락처</div>
                                <div className="info-value">{profile.phone}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">나이</div>
                                <div className="info-value">{profile.age}세</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">성별</div>
                                <div className="info-value">
                                    {profile.gender === 'PRIVATE' ? '비공개' : profile.gender}
                                </div>
                            </div>
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <div className="stat-number">{flatWorkspaces.length}</div>
                                <div className="stat-label">워크스페이스</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">{flatRooms.length}</div>
                                <div className="stat-label">채팅방</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">{attendanceRecords.length}</div>
                                <div className="stat-label">출석 일수</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-number">{activityLog.length}</div>
                                <div className="stat-label">활동 로그</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Workspace Summary */}
                <section className="chart card pad">
                    <div className="head">
                        <h3>워크스페이스 목록</h3>
                        <span className="l">총 {flatWorkspaces.length}개</span>
                        <button 
                            onClick={() => setShowWorkspaceModal(true)} 
                            className="create-workspace-button"
                            disabled={loading}
                            title="Create new workspace"
                            style={{
                                marginLeft: 'auto',
                                padding: '8px 12px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {loading ? '⟳' : '+'}
                        </button>
                    </div>
                    <div className="workspace-list-dashboard">
                        {flatWorkspaces.map((workspace) => (
                            <div
                                key={workspace.id}
                                className="workspace-item-dashboard"
                                onClick={() => handleWorkspaceClick(workspace.id)}
                            >
                                <div className="workspace-icon-dashboard"></div>
                                <div className="workspace-info-dashboard">
                                    <div className="workspace-name-dashboard">{workspace.name}</div>
                                    <div className="workspace-desc-dashboard">{workspace.description}</div>
                                    <div className="workspace-date-dashboard">{formatDate(workspace.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Rooms Summary */}
                <section className="chart card pad">
                    <div className="head">
                        <h3>채팅방</h3>
                        <span className="l">총 {flatRooms.filter(room => room.type === 'DM').length}개</span>
                        <button 
                            onClick={createRoom} 
                            className="create-room-button"
                            disabled={loading}
                            title="Create new room"
                            style={{
                                marginLeft: 'auto',
                                padding: '8px 12px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            {loading ? '⟳' : '+'}
                        </button>
                    </div>
                    <div className="rooms-list">
                        {flatRooms.filter(room => room.type === 'DM').map((room) => (
                            <div key={room.id} className="room-item" onClick={() => handleRoomClick(room.id)} style={{ cursor: 'pointer' }}>
                                <div className="room-icon"></div>
                                <div className="room-info">
                                    <div className="room-type">{room.type}</div>
                                    <div className="room-title">{room.title || `Room ${room.id}`}</div>
                                    <div className="room-status">
                                        마지막 메시지: {room.lastMessageId
                                            ? (lastMessages[room.id] || '메시지 로딩 중...')
                                            : '없음'
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Activity Log Table */}
                <section className="dashboard-table-card card">
                    <div className="dashboard-toolbar">
                        <div className="dashboard-tabs">
                            <p className="active">활동 로그</p>
                        </div>
                        <div className="dashboard-sp"></div>
                        <span className="dashboard-l">총 {activityLog.length}개</span>
                    </div>
                    <div className="dashboard-table-wrap">
                        <table className="dashboard-table">
                            <thead>
                                <tr>
                                    <th>번호</th>
                                    <th>워크스페이스</th>
                                    <th>ID</th>
                                    <th>메시지</th>
                                    <th>생성일</th>
                                    <th>수정일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLog.map((log, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <span className="dashboard-workspace-badge">
                                                {workspaceNames[log.workspaceId] || `워크스페이스 ${log.workspaceId}`}
                                            </span>
                                        </td>
                                        <td>{log.workspaceId}</td>
                                        <td>{log.message}</td>
                                        <td>{formatDate(log.createdAt)}</td>
                                        <td>{formatDate(log.updatedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Attendance Calendar */}
                <section className="attendance-calendar card">
                    <div className="attendance-header">
                        <h3>출석 기록</h3>
                        <div className="attendance-actions">
                            <span className="l">총 {attendanceRecords.length}일 출석</span>
                            <button
                                className="attendance-btn"
                                onClick={handleAttendanceCheck}
                                disabled={isAttendanceLoading || isAlreadyAttended()}
                            >
                                {isAttendanceLoading ? '처리중...' : isAlreadyAttended() ? '출석완료' : '출석하기'}
                            </button>
                        </div>
                    </div>
                    <div className="attendance-content">
                        <div className="calendar-section">
                            <div className="calendar-container">
                                <div className="github-contribution-graph">
                                    <div className="contribution-header">
                                        <h3>출석 기여도</h3>
                                        <div className="calendar-legend">
                                            <span>적음</span>
                                            <div className="legend-squares">
                                                <div className="legend-square level-0"></div>
                                                <div className="legend-square level-1"></div>
                                                <div className="legend-square level-2"></div>
                                                <div className="legend-square level-3"></div>
                                                <div className="legend-square level-4"></div>
                                            </div>
                                            <span>많음</span>
                                        </div>
                                    </div>
                                    <div className="monthly-sections">
                                        {generateMonthlyCalendarData().map((monthData, monthIndex) => (
                                            <div key={monthIndex} className="month-section-container">
                                                <div className="month-section-header">
                                                    <h4>{monthData.monthName} {monthData.year}</h4>
                                                </div>
                                                <div className="month-contribution-grid">
                                                    <div className="month-weekday-labels">
                                                        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                                                            <div key={index} className="weekday-label">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="month-contribution-days">
                                                        {monthData.days.map((day, dayIndex) => (
                                                            <div
                                                                key={dayIndex}
                                                                className={`contribution-square ${day.isEmpty ? 'empty' :
                                                                    day.attended ? 'level-4' : 'level-0'
                                                                    } ${day.isToday ? 'today' : ''}`}
                                                                title={day.isEmpty ? '' : `${monthData.year}-${(monthData.month + 1).toString().padStart(2, '0')}-${day.date.padStart(2, '0')}: ${day.attended ? '출석함' : '출석안함'}`}
                                                            ></div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="attendance-logs-section">
                            <h4>출석 기록 목록</h4>
                            <div className="attendance-logs">
                                {attendanceRecords.length > 0 ? (
                                    attendanceRecords
                                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                        .map((record) => (
                                            <div key={record.id} className="attendance-log-item">
                                                <div className="log-icon">✓</div>
                                                <div className="log-info">
                                                    <div className="log-id">출석 완료</div>
                                                    <div className="log-date">{formatDate(record.createdAt)}</div>
                                                    <div className="log-time">
                                                        {new Date(record.createdAt).toLocaleDateString('ko-KR', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="no-attendance">
                                        <p>아직 출석 기록이 없습니다.</p>
                                        <p>위 버튼을 눌러 첫 출석을 해보세요!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

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
