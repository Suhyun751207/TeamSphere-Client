import { useEffect, useState } from "react";
import DashboardService from "../api/dashboard/route";
import AttendanceService from "../api/user/Attendance";
import './Dashboard.css';

interface DashboardData {
    user: {
        id: number;
        email: string;
        password: string;
        createdAt: string;
        updatedAt: string;
    };
    profile: {
        userId: number;
        name: string;
        age: number;
        gender: string;
        phone: string;
        imagePath: string | null;
        subscriptionState: string;
        createdAt: string;
        updatedAt: string;
    };
    activityLog: Array<{
        userId: number;
        workspaceId: number;
        message: string;
        createdAt: string;
        updatedAt: string;
    }>;
    attendanceRecords: Array<{
        id: number;
        userId: number;
        createdAt: string;
    }>;
    rooms: Array<Array<{
        id: number;
        type: string;
        roomId: number | null;
        title: string | null;
        lastMessageId: number | null;
        createdAt: string;
        updatedAt: string;
    }>>;
    workspaces: Array<Array<{
        id: number;
        adminId: number;
        name: string;
        description: string;
        createdAt: string;
        updatedAt: string;
    }>>;
}

function Dashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

    useEffect(() => {
        DashboardService.Getdashboard().then((res) => {
            console.log(res.data);
            setDashboardData(res.data);
            setLoading(false);
        }).catch((error) => {
            console.error("Dashboard data fetch error:", error);
            setLoading(false);
        });
    }, []);

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

    const getMonthLabels = (): string[] => {
        const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        const endDate = new Date();
        const labels: string[] = [];
        
        // Show last 12 months
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
            labels.push(months[monthDate.getMonth()]);
        }
        
        return labels;
    };

    interface CalendarDay {
        date: string;
        attended: boolean;
        isToday: boolean;
        isEmpty?: boolean;
    }

    interface MonthData {
        year: number;
        month: number;
        monthName: string;
        days: CalendarDay[];
    }

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
                                <img src={profile.imagePath} alt={profile.name} />
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
                                <div className="info-label">나이</div>
                                <div className="info-value">{profile.age}세</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">성별</div>
                                <div className="info-value">
                                    {profile.gender === 'PRIVATE' ? '비공개' : profile.gender}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">연락처</div>
                                <div className="info-value">{profile.phone}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">가입일</div>
                                <div className="info-value">{formatDate(user.createdAt)}</div>
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
                        <h3>워크스페이스</h3>
                        <span className="l">총 {flatWorkspaces.length}개</span>
                    </div>
                    <div className="workspace-list">
                        {flatWorkspaces.map((workspace) => (
                            <div key={workspace.id} className="workspace-item">
                                <div className="workspace-icon"></div>
                                <div className="workspace-info">
                                    <div className="workspace-name">{workspace.name}</div>
                                    <div className="workspace-desc">{workspace.description}</div>
                                    <div className="workspace-date">{formatDate(workspace.createdAt)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Rooms Summary */}
                <section className="chart card pad">
                    <div className="head">
                        <h3>채팅방</h3>
                        <span className="l">총 {flatRooms.length}개</span>
                    </div>
                    <div className="rooms-list">
                        {flatRooms.map((room) => (
                            <div key={room.id} className="room-item">
                                <div className="room-icon"></div>
                                <div className="room-info">
                                    <div className="room-type">{room.type}</div>
                                    <div className="room-title">{room.title || `Room ${room.id}`}</div>
                                    <div className="room-status">
                                        {room.lastMessageId ? `마지막 메시지: ${room.lastMessageId}` : '메시지 없음'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Activity Log Table */}
                <section className="table-card card">
                    <div className="toolbar">
                        <div className="tabs">
                            <a className="active" href="#">활동 로그</a>
                        </div>
                        <div className="sp"></div>
                        <span className="l">총 {activityLog.length}개</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>워크스페이스 ID</th>
                                    <th>메시지</th>
                                    <th>생성일</th>
                                    <th>수정일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLog.map((log, index) => (
                                    <tr key={index}>
                                        <td>
                                            <span className="workspace-badge">
                                                {log.workspaceId}
                                            </span>
                                        </td>
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
                                                                className={`contribution-square ${
                                                                    day.isEmpty ? 'empty' : 
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
                                                    <div className="log-id">출석 #{record.id}</div>
                                                    <div className="log-date">{formatDate(record.createdAt)}</div>
                                                    <div className="log-time">
                                                        {new Date(record.createdAt).toLocaleTimeString('ko-KR', {
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
        </div>
    );
}

export default Dashboard;
