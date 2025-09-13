export interface TeamDashboardData {
  team: Team[];
  teamMembers: TeamMember[];
  teamRooms: TeamRoom[];
  tasks: Task[];
}

export interface Team {
  id: number;
  name: string;
  workspaceId: number;
  managerId: number;
}

export interface TeamMember {
  id: number;
  memberId: number;
  teamId: number;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
  updatedAt: string;
  workspaceMember: WorkspaceMember;
  profile: Profile;
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number;
  role: 'Admin' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  userId: number;
  name: string;
  age: number;
  gender: 'PRIVATE' | 'MALE' | 'FEMALE';
  phone: string;
  imagePath: string | null;
  subscriptionState: 'Free' | 'Admin' | 'Pro';
  createdAt: string;
  updatedAt: string;
}

export interface TeamRoom {
  id: number;
  roomId: number;
  userId: number;
  lastMessageId: number | null;
  createdAt: string;
  room: Room[];
}

export interface Room {
  id: number;
  type: 'TEAM';
  roomId: number;
  title: string;
  workspaceId: number;
  teamId: number;
  lastMessageId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  teamId: number;
  teamMemberId: number;
  state: 'To Do' | 'In Progress' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  task: string;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUser {
  profile: {
    userId: number;
    name: string;
    age: number;
    gender: 'PRIVATE' | 'MALE' | 'FEMALE';
    phone: string;
    imagePath: string | null;
    subscriptionState: 'Free' | 'Admin' | 'Pro';
    createdAt: string;
    updatedAt: string;
  }
}
