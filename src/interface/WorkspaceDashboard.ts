export interface WorkspaceInfo {
    id: number;
    adminId: number;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceMember {
    id: number;
    workspaceId: number;
    userId: number;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface WorkspaceTeam {
    id: number;
    name: string;
    workspaceId: number;
    managerId: number;
}

export interface MemberProfile {
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

export interface MemberProfileData {
    userId: number;
    memberId: number;
    role: string;
    profile: MemberProfile[];
}

export interface AttendanceRecord {
    id: number;
    userId: number;
    createdAt: string;
}

export interface MemberAttendanceData {
    userId: number;
    memberId: number;
    attendanceRecords: AttendanceRecord[];
}

export interface TeamMember {
    id: number;
    memberId: number;
    teamId: number;
    role: string;
    createdAt: string;
    updatedAt: string;
}

export interface Task {
    id: number;
    teamMemberId: number;
    state: string;
    priority: string;
    task: string;
    externalId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TeamDetail {
    team: WorkspaceTeam;
    members: TeamMember[];
    tasks: Task[];
}

export interface WorkspaceDashboardData {
    workspace: WorkspaceInfo[];
    workspaceMember: WorkspaceMember[];
    workspaceTeam: WorkspaceTeam[];
    memberProfiles: MemberProfileData[];
    memberAttendance: MemberAttendanceData[];
    teamDetails: TeamDetail[];
    workspaceTasks: Task[];
}
