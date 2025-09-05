export interface DashboardUser {
    id: number;
    email: string;
    password: string;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardProfile {
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

export interface ActivityLog {
    userId: number;
    workspaceId: number;
    message: string;
    createdAt: string;
    updatedAt: string;
}

export interface AttendanceRecord {
    id: number;
    userId: number;
    createdAt: string;
}

export interface DashboardRoom {
    id: number;
    type: string;
    roomId: number | null;
    title: string | null;
    lastMessageId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface DashboardWorkspace {
    id: number;
    adminId: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface CalendarDay {
    date: string;
    attended: boolean;
    isToday: boolean;
    isEmpty?: boolean;
}

export interface MonthData {
    year: number;
    month: number;
    monthName: string;
    days: CalendarDay[];
}

export interface DashboardData {
    user: DashboardUser;
    profile: DashboardProfile;
    activityLog: ActivityLog[];
    attendanceRecords: AttendanceRecord[];
    rooms: DashboardRoom[][];
    workspaces: DashboardWorkspace[][];
}
