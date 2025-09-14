import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TeamDashboardData } from '../../../interface/teamDashboard';
import { TaskCreateRequest, TaskByTaskCreateRequest, CommentCreateRequest } from '../../../interface/task';
import './TeamDashboard.css';
import TeamAPI from '../../../api/workspace/team';
import TeamMessageServer from '../../../api/workspace/team/teamMessage';
import TaskService from '../../../api/task/task';
import ProfileService from '../../../api/user/profile/profile';
import Footer from "../../../components/Footer";

export default function TeamDashboard() {
    const { workspaceId, teamId } = useParams<{ workspaceId: string; teamId: string }>();
    const navigate = useNavigate();

    const [dashboardData, setDashboardData] = useState<TeamDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'tasks'>('overview');
    const [teamRooms, setTeamRooms] = useState<any[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomMessages, setRoomMessages] = useState<{ [key: number]: string }>({});

    // Task Management State
    const [tasks, setTasks] = useState<any[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksError, setTasksError] = useState<string | null>(null);
    const [expandedTaskGroups, setExpandedTaskGroups] = useState<Set<number>>(new Set());
    const [sortBy, setSortBy] = useState<string>('newest');
    const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
    const [taskComments, setTaskComments] = useState<any[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [memberDetails, setMemberDetails] = useState<{ [key: number]: any }>({});
    const [commentProfiles, setCommentProfiles] = useState<{ [key: number]: any }>({});

    // Task Edit Modal State
    const [showEditTaskModal, setShowEditTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [editTaskFormData, setEditTaskFormData] = useState<TaskCreateRequest>({
        task: '',
        priority: 'Medium',
        state: 'To Do'
    });

    // Task Creation Form State
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskFormData, setTaskFormData] = useState<TaskCreateRequest>({
        task: '',
        priority: 'Medium',
        state: 'To Do'
    });
    const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null);

    // Child Task Creation State
    const [showChildTaskForm, setShowChildTaskForm] = useState<{ [key: number]: boolean }>({});
    const [childTaskFormData, setChildTaskFormData] = useState<TaskByTaskCreateRequest>({
        title: '',
        content: '',
        tags: [],
        attachments_path: []
    });

    // Comment State
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentFormData, setCommentFormData] = useState<CommentCreateRequest>({
        content: '',
        parent_id: null
    });
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentContent, setEditCommentContent] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 팀 대시보드 데이터 가져오기
            const dashboardResponse = await TeamAPI.getTeamDashboard(Number(workspaceId), Number(teamId));
            setDashboardData(dashboardResponse.data);

            // 팀 채팅방 데이터 가져오기
            await fetchTeamRooms();

            // 작업 데이터 가져오기
            if (activeTab === 'tasks') {
                await fetchTasks();
            }

        } catch (err) {
            console.error('Error fetching team dashboard data:', err);
            setError('팀 대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [workspaceId, teamId, activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchTeamRooms = async () => {
        if (!workspaceId || !teamId) return;

        try {
            setRoomsLoading(true);
            const roomsResponse = await TeamMessageServer.TeamRoomList(Number(workspaceId), Number(teamId));
            const rooms = roomsResponse.data || [];
            setTeamRooms(rooms);

            // 각 룸의 마지막 메시지 가져오기
            const messagesMap: { [key: number]: string } = {};
            for (const room of rooms) {
                if (room.room?.[0]?.lastMessageId) {
                    try {
                        const messagesResponse = await TeamMessageServer.TeamMessageList(Number(workspaceId), Number(teamId), room.roomId);
                        const messages = messagesResponse.data || [];
                        const lastMessage = messages.find((msg: any) => msg.id === room.room[0].lastMessageId);
                        if (lastMessage) {
                            messagesMap[room.roomId] = lastMessage.content.length > 30
                                ? lastMessage.content.substring(0, 30) + '...'
                                : lastMessage.content;
                        }
                    } catch (err) {
                        console.error(`Failed to load message for room ${room.roomId}:`, err);
                    }
                }
            }
            setRoomMessages(messagesMap);
        } catch (err) {
            console.error('Error fetching team rooms:', err);
        } finally {
            setRoomsLoading(false);
        }
    };

    const createTeamRoom = async () => {
        if (!workspaceId || !teamId) return;

        try {
            setRoomsLoading(true);
            const roomName = prompt("팀 채팅방 이름을 입력하세요:");
            if (!roomName) {
                setRoomsLoading(false);
                return;
            }

            await TeamMessageServer.TeamRoomCreate(Number(workspaceId), Number(teamId), {
                title: roomName,
                description: ""
            });
            await fetchTeamRooms();
        } catch (err) {
            console.error('Failed to create team room:', err);
            alert('팀 채팅방 생성에 실패했습니다.');
        } finally {
            setRoomsLoading(false);
        }
    };

    // Task Management Functions
    const fetchTasks = async () => {
        if (!workspaceId || !teamId) return;

        try {
            setTasksLoading(true);
            setTasksError(null);
            const response = await TaskService.getTeamTasks(Number(workspaceId), Number(teamId));
            setTasks(response.data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setTasksError('작업 목록을 불러오는데 실패했습니다.');
        } finally {
            setTasksLoading(false);
        }
    };

    const handleCreateTask = async () => {
        if (!workspaceId || !teamId || !selectedAssignee) return;

        try {
            setTasksLoading(true);
            const taskData = {
                ...taskFormData,
                teamMemberId: selectedAssignee
            };
            await TaskService.createTask(Number(workspaceId), Number(teamId), taskData);
            await fetchTasks();
            setShowTaskForm(false);
            setTaskFormData({ task: '', priority: 'Medium', state: 'To Do' });
            setSelectedAssignee(null);
        } catch (err) {
            console.error('Error creating task:', err);
            setTasksError('작업 생성에 실패했습니다.');
        } finally {
            setTasksLoading(false);
        }
    };

    const handleUpdateTask = async (tasksId: number, taskData: TaskCreateRequest) => {
        if (!workspaceId || !teamId) return;

        try {
            setTasksLoading(true);
            await TaskService.updateTask(Number(workspaceId), Number(teamId), tasksId, taskData);
            await fetchTasks();
        } catch (err) {
            console.error('Error updating task:', err);
            setTasksError('작업 업데이트에 실패했습니다.');
        } finally {
            setTasksLoading(false);
        }
    };

    const handleEditTask = (task: any) => {
        setEditingTask(task);
        setEditTaskFormData({
            task: task.task,
            priority: task.priority,
            state: task.state
        });
        setShowEditTaskModal(true);
    };

    const handleSaveTaskEdit = async () => {
        if (!editingTask || !workspaceId || !teamId) return;

        try {
            setTasksLoading(true);
            await TaskService.updateTask(Number(workspaceId), Number(teamId), editingTask.id, editTaskFormData);
            await fetchTasks();
            setShowEditTaskModal(false);
            setEditingTask(null);
            setEditTaskFormData({ task: '', priority: 'Medium', state: 'To Do' });
        } catch (err) {
            console.error('Error updating task:', err);
            setTasksError('작업 업데이트에 실패했습니다.');
        } finally {
            setTasksLoading(false);
        }
    };

    const handleCancelTaskEdit = () => {
        setShowEditTaskModal(false);
        setEditingTask(null);
        setEditTaskFormData({ task: '', priority: 'Medium', state: 'To Do' });
    };

    const handleExpandTaskGroup = async (tasksId: number) => {
        if (!workspaceId || !teamId) return;

        const newExpanded = new Set(expandedTaskGroups);
        if (newExpanded.has(tasksId)) {
            newExpanded.delete(tasksId);
        } else {
            newExpanded.add(tasksId);
            // Fetch child tasks
            try {
                const response = await TaskService.TasksIdByGetTask(Number(workspaceId), Number(teamId), tasksId);
                // Update tasks with child tasks data
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === tasksId
                            ? { ...task, childTasks: response.data || [] }
                            : task
                    )
                );
            } catch (err) {
                console.error('Error fetching child tasks:', err);
            }
        }
        setExpandedTaskGroups(newExpanded);
    };

    const handleCreateChildTask = async (tasksId: number) => {
        if (!workspaceId || !teamId) return;

        try {
            setTasksLoading(true);
            await TaskService.TasksIdByCreateTask(Number(workspaceId), Number(teamId), tasksId, childTaskFormData);
            // Refresh child tasks
            const response = await TaskService.TasksIdByGetTask(Number(workspaceId), Number(teamId), tasksId);
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === tasksId
                        ? { ...task, childTasks: response.data || [] }
                        : task
                )
            );
            setShowChildTaskForm({ ...showChildTaskForm, [tasksId]: false });
            setChildTaskFormData({ title: '', content: '', tags: [], attachments_path: [] });
        } catch (err) {
            console.error('Error creating child task:', err);
            setTasksError('하위 작업 생성에 실패했습니다.');
        } finally {
            setTasksLoading(false);
        }
    };

    const fetchTaskComments = async (tasksId: number, taskId: number) => {
        if (!workspaceId || !teamId) return;

        try {
            setCommentsLoading(true);
            const response = await TaskService.getComments(Number(workspaceId), Number(teamId), tasksId, taskId);
            const comments = response.data || [];
            setTaskComments(comments);

            // Fetch profiles for all comment authors
            const profilePromises = comments.map((comment: any) =>
                comment.workspace_team_user_id ? fetchCommentProfile(comment.workspace_team_user_id) : null
            );
            await Promise.all(profilePromises.filter(Boolean));
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    const fetchMemberDetails = async (memberId: number) => {
        if (memberDetails[memberId]) return memberDetails[memberId];

        try {
            const response = await TaskService.taskMember(
                Number(workspaceId),
                Number(teamId),
                memberId
            );
            const member = response.data;
            setMemberDetails(prev => ({ ...prev, [memberId]: member }));
            return member;
        } catch (error) {
            console.error('Failed to fetch member details:', error);
            return null;
        }
    };

    const fetchCommentProfile = async (workspaceTeamUserId: number) => {
        if (commentProfiles[workspaceTeamUserId]) return commentProfiles[workspaceTeamUserId];

        try {
            const response = await ProfileService.getProfile(workspaceTeamUserId);
            const profile = response.data.profile;
            setCommentProfiles(prev => ({ ...prev, [workspaceTeamUserId]: profile }));
            return profile;
        } catch (error) {
            console.error('Failed to fetch comment profile:', error);
            return null;
        }
    };

    const handleViewTaskDetail = async (tasksId: number, taskId: number) => {
        if (!workspaceId || !teamId) return;

        try {
            const response = await TaskService.TasksIdByGetTaskId(Number(workspaceId), Number(teamId), tasksId, taskId);
            setSelectedTaskDetail(response.data);
            await fetchTaskComments(tasksId, taskId);
        } catch (err) {
            console.error('Error fetching task detail:', err);
        }
    };

    const handleUpdateChildTask = async (tasksId: number, taskId: number, taskData: TaskByTaskCreateRequest) => {
        if (!workspaceId || !teamId) return;

        try {
            setTasksLoading(true);
            await TaskService.TasksIdByUpdateTaskId(Number(workspaceId), Number(teamId), tasksId, taskId, taskData);
            // Refresh task detail
            await handleViewTaskDetail(tasksId, taskId);
            // Refresh child tasks list
            const response = await TaskService.TasksIdByGetTask(Number(workspaceId), Number(teamId), tasksId);
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === tasksId
                        ? { ...task, childTasks: response.data || [] }
                        : task
                )
            );
        } catch (err) {
            console.error('Error updating child task:', err);
            setTasksError('하위 작업 업데이트에 실패했습니다.');
        } finally {
            setTasksLoading(false);
        }
    };

    const handleCreateComment = async (tasksId: number, taskId: number) => {
        if (!workspaceId || !teamId) return;

        try {
            setCommentsLoading(true);
            await TaskService.createComment(Number(workspaceId), Number(teamId), tasksId, taskId, commentFormData);
            await fetchTaskComments(tasksId, taskId);
            setShowCommentForm(false);
            setCommentFormData({ content: '', parent_id: null });
        } catch (err) {
            console.error('Error creating comment:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleViewCommentDetail = async (tasksId: number, taskId: number, commentsId: number) => {
        if (!workspaceId || !teamId) return;

        try {
            const response = await TaskService.getCommentsId(Number(workspaceId), Number(teamId), tasksId, taskId, commentsId);
            // Show comment detail in modal or expand view
            console.log('Comment detail:', response.data);
        } catch (err) {
            console.error('Error fetching comment detail:', err);
        }
    };

    const handleUpdateComment = async (tasksId: number, taskId: number, commentsId: number) => {
        if (!workspaceId || !teamId) return;

        try {
            setCommentsLoading(true);
            const updateData = { content: editCommentContent, parent_id: null };
            await TaskService.updateComment(Number(workspaceId), Number(teamId), tasksId, taskId, commentsId, updateData);
            await fetchTaskComments(tasksId, taskId);
            setEditingComment(null);
            setEditCommentContent('');
        } catch (err) {
            console.error('Error updating comment:', err);
        } finally {
            setCommentsLoading(false);
        }
    };

    // Effect to fetch tasks when switching to tasks tab
    useEffect(() => {
        if (activeTab === 'tasks' && workspaceId && teamId) {
            fetchTasks();
        }
    }, [activeTab, workspaceId, teamId]);

    const getTaskStats = () => {
        if (!dashboardData?.tasks) return { total: 0, completed: 0, inProgress: 0, todo: 0 };

        const total = dashboardData.tasks.length;
        const completed = dashboardData.tasks.filter(task => task.state === 'Done').length;
        const inProgress = dashboardData.tasks.filter(task => task.state === 'In Progress').length;
        const todo = dashboardData.tasks.filter(task => task.state === 'To Do').length;

        return { total, completed, inProgress, todo };
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'High': return 'teamDashboard-priority-high';
            case 'Medium': return 'teamDashboard-priority-medium';
            case 'Low': return 'teamDashboard-priority-low';
            default: return 'teamDashboard-priority-medium';
        }
    };

    const getStateBadgeClass = (state: string) => {
        switch (state) {
            case 'Done': return 'teamDashboard-state-done';
            case 'In Progress': return 'teamDashboard-state-progress';
            case 'To Do': return 'teamDashboard-state-todo';
            default: return 'teamDashboard-state-todo';
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'teamDashboard-role-admin';
            case 'MEMBER': return 'teamDashboard-role-member';
            default: return 'teamDashboard-role-member';
        }
    };

    const getSubscriptionBadgeClass = (subscription: string) => {
        switch (subscription) {
            case 'Admin': return 'teamDashboard-subscription-admin';
            case 'Pro': return 'teamDashboard-subscription-pro';
            case 'Free': return 'teamDashboard-subscription-free';
            default: return 'teamDashboard-subscription-free';
        }
    };

    const formatDate = (dateString: string) => {
        if (isNaN(new Date(dateString).getTime())) return '오류';
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const sortTasks = (tasks: any[]) => {
        const sortedTasks = [...tasks];
        
        switch (sortBy) {
            case 'newest':
                return sortedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case 'oldest':
                return sortedTasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            case 'priority':
                const priorityOrder: Record<string, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return sortedTasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
            default:
                return sortedTasks;
        }
    };

    const getMemberByTeamMemberId = (teamMemberId: number) => {
        return dashboardData?.teamMembers.find(member => member.id === teamMemberId);
    };

    if (loading) {
        return <div className="teamDashboard-loading">팀 대시보드를 불러오는 중...</div>;
    }

    if (error) {
        return <div className="teamDashboard-error">{error}</div>;
    }

    if (!dashboardData || !dashboardData.team[0]) {
        return <div className="teamDashboard-error">팀 데이터를 찾을 수 없습니다.</div>;
    }

    const team = dashboardData.team[0];
    const taskStats = getTaskStats();

    return (
        <>
            <div className="teamDashboard">
                {/* Top bar */}
                <div className="teamDashboard-topbar">
                    <button
                        className="teamDashboard-back-btn"
                        onClick={() => navigate(`/workspace/${workspaceId}`)}
                    >
                        ← 워크스페이스로 돌아가기
                    </button>
                    <h1 className="teamDashboard-title">{team.name} 대시보드</h1>
                </div>
                <div className="teamDashboard-body">
                    {/* Summary Cards */}
                    <div className="teamDashboard-summary-cards">
                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-members-icon">
                                👥
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">팀 멤버</div>
                                <div className="teamDashboard-summary-card-value">{dashboardData.teamMembers.length}</div>
                                <div className="teamDashboard-summary-card-subtitle">활성 멤버</div>
                            </div>
                        </div>

                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-tasks-icon">
                                📋
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">총 작업</div>
                                <div className="teamDashboard-summary-card-value">{taskStats.total}</div>
                                <div className="teamDashboard-summary-card-subtitle">전체 작업</div>
                            </div>
                        </div>

                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-progress-icon">
                                ✅
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">완료율</div>
                                <div className="teamDashboard-summary-card-value">
                                    {taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}%
                                </div>
                                <div className="teamDashboard-summary-card-subtitle">
                                    {taskStats.completed}/{taskStats.total} 완료
                                </div>
                            </div>
                        </div>

                        <div className="teamDashboard-summary-card">
                            <div className="teamDashboard-summary-card-icon teamDashboard-chat-icon">
                                💬
                            </div>
                            <div className="teamDashboard-summary-card-content">
                                <div className="teamDashboard-summary-card-title">채팅방</div>
                                <div className="teamDashboard-summary-card-value">{dashboardData.teamRooms.length}</div>
                                <div className="teamDashboard-summary-card-subtitle">활성 채팅방</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabbed Content */}
                    <div className="teamDashboard-content-card teamDashboard-tabbed-card">
                        <div className="teamDashboard-tab-header">
                            <button
                                className={`teamDashboard-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                개요
                            </button>
                            <button
                                className={`teamDashboard-tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                                onClick={() => setActiveTab('members')}
                            >
                                멤버
                            </button>
                            <button
                                className={`teamDashboard-tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tasks')}
                            >
                                작업
                            </button>
                        </div>

                        <div className="teamDashboard-tab-content">
                            {activeTab === 'overview' && (
                                <div className="teamDashboard-overview">
                                    <div className="teamDashboard-overview-grid">
                                        {/* 작업 통계 */}
                                        <div className="teamDashboard-overview-section">
                                            <h3>작업 통계</h3>
                                            <div className="teamDashboard-task-stats">
                                                <div className="teamDashboard-stat-item">
                                                    <span className="teamDashboard-stat-label">할 일</span>
                                                    <span className="teamDashboard-stat-value">{taskStats.todo}</span>
                                                </div>
                                                <div className="teamDashboard-stat-item">
                                                    <span className="teamDashboard-stat-label">진행 중</span>
                                                    <span className="teamDashboard-stat-value">{taskStats.inProgress}</span>
                                                </div>
                                                <div className="teamDashboard-stat-item">
                                                    <span className="teamDashboard-stat-label">완료</span>
                                                    <span className="teamDashboard-stat-value">{taskStats.completed}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 팀 정보 */}
                                        <div className="teamDashboard-overview-section">
                                            <h3>팀 정보</h3>
                                            <div className="teamDashboard-team-info">
                                                <div className="teamDashboard-info-item">
                                                    <span className="teamDashboard-info-label">팀 이름</span>
                                                    <span className="teamDashboard-info-value">{team.name}</span>
                                                </div>
                                                <div className="teamDashboard-info-item">
                                                    <span className="teamDashboard-info-label">워크스페이스 ID</span>
                                                    <span className="teamDashboard-info-value">{team.workspaceId}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'members' && (
                                <div className="teamDashboard-members">
                                    <div className="teamDashboard-members-grid">
                                        {dashboardData.teamMembers.map((member) => (
                                            <div key={member.id} className="teamDashboard-member-card">
                                                <div className="teamDashboard-member-avatar">
                                                    {member.profile.imagePath ? (
                                                        <img src={member.profile.imagePath} alt={member.profile.name} />
                                                    ) : (
                                                        member.profile.name.charAt(0)
                                                    )}
                                                </div>
                                                <div className="teamDashboard-member-info">
                                                    <div className='teamDashboard-member-name-div'>
                                                        <div>
                                                            <div className="teamDashboard-member-name">{member.profile.name}</div>
                                                            <div className="teamDashboard-member-roles">
                                                                <span className={`teamDashboard-role-badge ${getRoleBadgeClass(member.role)}`}>
                                                                    {member.role}
                                                                </span>
                                                                <span className={`teamDashboard-subscription-badge ${getSubscriptionBadgeClass(member.profile.subscriptionState)}`}>
                                                                    {member.profile.subscriptionState}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="teamDashboard-member-details">
                                                            <span>연락처: {member.profile.phone}</span>
                                                            <span>가입일: {formatDate(member.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="teamDashboard-tasks">
                                    {/* Task Creation Form */}
                                    <div className="teamDashboard-task-creation">
                                        <div className="teamDashboard-task-creation-header">
                                            <h4>새 작업 그룹 생성</h4>
                                            <div className="teamDashboard-task-header-controls">
                                                <select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                    className="teamDashboard-sort-select"
                                                >
                                                    <option value="newest">최신순</option>
                                                    <option value="oldest">오래된 순서</option>
                                                    <option value="priority">우선순위</option>
                                                </select>
                                                <button
                                                    className="teamDashboard-btn-primary"
                                                    onClick={() => setShowTaskForm(!showTaskForm)}
                                                >
                                                    {showTaskForm ? '취소' : '+ 작업 추가'}
                                                </button>
                                            </div>
                                        </div>

                                        {showTaskForm && (
                                            <div className="teamDashboard-task-form">
                                                <div className="teamDashboard-form-row">
                                                    <div className="teamDashboard-form-group">
                                                        <label>작업 제목</label>
                                                        <input
                                                            type="text"
                                                            value={taskFormData.task}
                                                            onChange={(e) => setTaskFormData({ ...taskFormData, task: e.target.value })}
                                                            placeholder="작업 제목을 입력하세요"
                                                        />
                                                    </div>
                                                    <div className="teamDashboard-form-group">
                                                        <label>우선순위</label>
                                                        <select
                                                            value={taskFormData.priority}
                                                            onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as any })}
                                                        >
                                                            <option value="High">높음</option>
                                                            <option value="Medium">보통</option>
                                                            <option value="Low">낮음</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="teamDashboard-form-row">
                                                    <div className="teamDashboard-form-group">
                                                        <label>상태</label>
                                                        <select
                                                            value={taskFormData.state}
                                                            onChange={(e) => setTaskFormData({ ...taskFormData, state: e.target.value as any })}
                                                        >
                                                            <option value="To Do">할 일</option>
                                                            <option value="In Progress">진행 중</option>
                                                            <option value="Done">완료</option>
                                                        </select>
                                                    </div>
                                                    <div className="teamDashboard-form-group">
                                                        <label>담당자</label>
                                                        <select
                                                            value={selectedAssignee || ''}
                                                            onChange={(e) => setSelectedAssignee(Number(e.target.value))}
                                                        >
                                                            <option value="">담당자 선택</option>
                                                            {dashboardData?.teamMembers.map(member => (
                                                                <option key={member.id} value={member.id}>
                                                                    {member.profile.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="teamDashboard-form-actions">
                                                    <button
                                                        className="teamDashboard-btn-primary"
                                                        onClick={handleCreateTask}
                                                        disabled={!taskFormData.task || !selectedAssignee || tasksLoading}
                                                    >
                                                        {tasksLoading ? '생성 중...' : '작업 생성'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tasks Error */}
                                    {tasksError && (
                                        <div className="teamDashboard-error">{tasksError}</div>
                                    )}

                                    {/* Tasks Loading */}
                                    {tasksLoading && (
                                        <div className="teamDashboard-loading">작업 목록을 불러오는 중...</div>
                                    )}

                                    {/* Tasks List */}
                                    <div className="teamDashboard-tasks-list">
                                        {tasks.length === 0 ? (
                                            <div className="teamDashboard-empty-state">생성된 작업이 없습니다.</div>
                                        ) : (
                                            sortTasks(tasks).map((task) => {
                                            const assignedMember = getMemberByTeamMemberId(task.teamMemberId);
                                            const isExpanded = expandedTaskGroups.has(task.id);

                                            return (
                                                <div key={task.id} className="teamDashboard-task-card teamDashboard-task-group">
                                                    <div className="teamDashboard-task-header">
                                                        <div className="teamDashboard-task-title-row">
                                                            <button
                                                                className="teamDashboard-expand-btn"
                                                                onClick={() => handleExpandTaskGroup(task.id)}
                                                            >
                                                                {isExpanded ? '▼' : '▶'}
                                                            </button>
                                                            <div className="teamDashboard-task-title">{task.task}</div>
                                                        </div>
                                                        <div className="teamDashboard-task-badges">
                                                            <span className={`teamDashboard-priority-badge ${getPriorityBadgeClass(task.priority)}`}>
                                                                {task.priority}
                                                            </span>
                                                            <span className={`teamDashboard-state-badge ${getStateBadgeClass(task.state)}`}>
                                                                {task.state}
                                                            </span>
                                                            <button
                                                                className="teamDashboard-task-settings-btn"
                                                                onClick={() => handleEditTask(task)}
                                                                title="작업 설정"
                                                            >
                                                                ⚙️
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="teamDashboard-task-details">
                                                        {assignedMember && (
                                                            <div
                                                                className="teamDashboard-task-assignee"
                                                                onClick={() => fetchMemberDetails(assignedMember.id)}
                                                                style={{ cursor: 'pointer' }}
                                                                title="클릭하여 멤버 상세 정보 보기"
                                                            >
                                                                <div className="teamDashboard-assignee-avatar">
                                                                    {assignedMember.profile.imagePath ? (
                                                                        <img src={assignedMember.profile.imagePath} alt={assignedMember.profile.name} />
                                                                    ) : (
                                                                        assignedMember.profile.name.charAt(0)
                                                                    )}
                                                                </div>
                                                                <span>{assignedMember.profile.name}</span>
                                                            </div>
                                                        )}
                                                        <div className="teamDashboard-task-dates">
                                                            <span>생성일: {formatDate(task.createdAt)}</span>
                                                            <span>수정일: {formatDate(task.updatedAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Task Group Actions */}
                                                    <div className="teamDashboard-task-actions">
                                                        <button
                                                            className="teamDashboard-btn-secondary"
                                                            onClick={() => setShowChildTaskForm({ ...showChildTaskForm, [task.id]: !showChildTaskForm[task.id] })}
                                                        >
                                                            하위 작업 추가
                                                        </button>
                                                    </div>

                                                    {/* Child Task Creation Form */}
                                                    {showChildTaskForm[task.id] && (
                                                        <div className="teamDashboard-child-task-form">
                                                            <div className="teamDashboard-form-group">
                                                                <label>제목</label>
                                                                <input
                                                                    type="text"
                                                                    value={childTaskFormData.title}
                                                                    onChange={(e) => setChildTaskFormData({ ...childTaskFormData, title: e.target.value })}
                                                                    placeholder="하위 작업 제목"
                                                                />
                                                            </div>
                                                            <div className="teamDashboard-form-group">
                                                                <label>내용</label>
                                                                <textarea
                                                                    value={childTaskFormData.content}
                                                                    onChange={(e) => setChildTaskFormData({ ...childTaskFormData, content: e.target.value })}
                                                                    placeholder="하위 작업 내용"
                                                                    rows={3}
                                                                />
                                                            </div>
                                                            <div className="teamDashboard-form-group">
                                                                <label>태그 (쉼표로 구분)</label>
                                                                <input
                                                                    type="text"
                                                                    value={childTaskFormData.tags.join(', ')}
                                                                    onChange={(e) => setChildTaskFormData({ ...childTaskFormData, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) })}
                                                                    placeholder="태그1, 태그2, 태그3"
                                                                />
                                                            </div>
                                                            <div className="teamDashboard-form-actions">
                                                                <button
                                                                    className="teamDashboard-btn-primary"
                                                                    onClick={() => handleCreateChildTask(task.id)}
                                                                    disabled={!childTaskFormData.title || tasksLoading}
                                                                >
                                                                    하위 작업 생성
                                                                </button>
                                                                <button
                                                                    className="teamDashboard-btn-secondary"
                                                                    onClick={() => setShowChildTaskForm({ ...showChildTaskForm, [task.id]: false })}
                                                                >
                                                                    취소
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Child Tasks List */}
                                                    {isExpanded && task.childTasks && (
                                                        <div className="teamDashboard-child-tasks">
                                                            <h5>하위 작업 목록</h5>
                                                            {task.childTasks.length > 0 ? (
                                                                <div className="teamDashboard-child-tasks-list">
                                                                    {task.childTasks.map((childTask: any) => (
                                                                        <div
                                                                            key={childTask.id}
                                                                            className="teamDashboard-child-task-item"
                                                                            onClick={() => handleViewTaskDetail(task.id, childTask.id)}
                                                                        >
                                                                            <div className="teamDashboard-child-task-title">{childTask.title}</div>
                                                                            <div className="teamDashboard-child-task-content">{childTask.content}</div>
                                                                            {childTask.tags && childTask.tags.length > 0 && (
                                                                                <div className="teamDashboard-child-task-tags">
                                                                                    {childTask.tags.map((tag: string, index: number) => (
                                                                                        <span key={index} className="teamDashboard-tag">{tag}</span>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="teamDashboard-no-child-tasks">하위 작업이 없습니다.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                        )}

                                        {tasks.length === 0 && !tasksLoading && (
                                            <div className="teamDashboard-no-tasks">
                                                <p>생성된 작업이 없습니다.</p>
                                                <button
                                                    className="teamDashboard-btn-primary"
                                                    onClick={() => setShowTaskForm(true)}
                                                >
                                                    첫 번째 작업 만들기
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Task Detail Modal */}
                                    {selectedTaskDetail && (
                                        <div className="teamDashboard-modal-overlay" onClick={() => setSelectedTaskDetail(null)}>
                                            <div className="teamDashboard-modal" onClick={(e) => e.stopPropagation()}>
                                                <div className="teamDashboard-modal-header">
                                                    <h3>작업 상세 정보</h3>
                                                    <button
                                                        className="teamDashboard-modal-close"
                                                        onClick={() => setSelectedTaskDetail(null)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                                <div className="teamDashboard-modal-content">
                                                    <div className="teamDashboard-task-detail">
                                                        <h4>{selectedTaskDetail.title}</h4>
                                                        <p>{selectedTaskDetail.content}</p>
                                                        {selectedTaskDetail.tags && selectedTaskDetail.tags.length > 0 && (
                                                            <div className="teamDashboard-task-detail-tags">
                                                                {selectedTaskDetail.tags.map((tag: string, index: number) => (
                                                                    <span key={index} className="teamDashboard-tag">{tag}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Comments Section */}
                                                    <div className="teamDashboard-comments-section">
                                                        <div className="teamDashboard-comments-header">
                                                            <h5>댓글</h5>
                                                            <button
                                                                className="teamDashboard-btn-secondary"
                                                                onClick={() => setShowCommentForm(!showCommentForm)}
                                                            >
                                                                댓글 추가
                                                            </button>
                                                        </div>

                                                        {showCommentForm && (
                                                            <div className="teamDashboard-comment-form">
                                                                <textarea
                                                                    value={commentFormData.content}
                                                                    onChange={(e) => setCommentFormData({ ...commentFormData, content: e.target.value })}
                                                                    placeholder="댓글을 입력하세요"
                                                                    rows={3}
                                                                />
                                                                <div className="teamDashboard-form-actions">
                                                                    <button
                                                                        className="teamDashboard-btn-primary"
                                                                        onClick={() => handleCreateComment(selectedTaskDetail.tasksId, selectedTaskDetail.id)}
                                                                        disabled={!commentFormData.content || commentsLoading}
                                                                    >
                                                                        댓글 작성
                                                                    </button>
                                                                    <button
                                                                        className="teamDashboard-btn-secondary"
                                                                        onClick={() => setShowCommentForm(false)}
                                                                    >
                                                                        취소
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {commentsLoading ? (
                                                            <div className="teamDashboard-loading">댓글을 불러오는 중...</div>
                                                        ) : (
                                                            <div className="teamDashboard-comments-list">
                                                                {taskComments.map((comment: any) => (
                                                                    <div key={comment.id} className="teamDashboard-comment-item">
                                                                        <div className="teamDashboard-comment-header">
                                                                            <span className="teamDashboard-comment-author">
                                                                                {comment.workspace_team_user_id && commentProfiles[comment.workspace_team_user_id]
                                                                                    ? commentProfiles[comment.workspace_team_user_id].name || commentProfiles[comment.workspace_team_user_id].username
                                                                                    : comment.author || 'Unknown'}
                                                                            </span>
                                                                            <span className="teamDashboard-comment-date">{formatDate(comment.created_at)}</span>
                                                                            <div className="teamDashboard-comment-actions">
                                                                                <button
                                                                                    className="teamDashboard-btn-link"
                                                                                    onClick={() => {
                                                                                        setEditingComment(comment.id);
                                                                                        setEditCommentContent(comment.content);
                                                                                    }}
                                                                                >
                                                                                    수정
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {editingComment === comment.id ? (
                                                                            <div className="teamDashboard-comment-edit">
                                                                                <textarea
                                                                                    value={editCommentContent}
                                                                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                                                                    rows={3}
                                                                                />
                                                                                <div className="teamDashboard-form-actions">
                                                                                    <button
                                                                                        className="teamDashboard-btn-primary"
                                                                                        onClick={() => handleUpdateComment(selectedTaskDetail.tasksId, selectedTaskDetail.id, comment.id)}
                                                                                        disabled={commentsLoading}
                                                                                    >
                                                                                        저장
                                                                                    </button>
                                                                                    <button
                                                                                        className="teamDashboard-btn-secondary"
                                                                                        onClick={() => {
                                                                                            setEditingComment(null);
                                                                                            setEditCommentContent('');
                                                                                        }}
                                                                                    >
                                                                                        취소
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="teamDashboard-comment-content">
                                                                                {comment.content}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}

                                                                {taskComments.length === 0 && (
                                                                    <p className="teamDashboard-no-comments">댓글이 없습니다.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Team Rooms Section */}
                <section className="teamDashboard-rooms-section teamDashboard-content-card">
                    <div className="teamDashboard-content-card-header">
                        <h3>팀 채팅방</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>총 {teamRooms.length}개</span>
                            <button
                                onClick={createTeamRoom}
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
                                title="새 팀 채팅방 생성"
                            >
                                {roomsLoading ? '⟳' : '+ 채팅방 생성'}
                            </button>
                        </div>
                    </div>
                    {roomsLoading ? (
                        <div className="teamDashboard-loading">팀 채팅방 목록을 불러오는 중...</div>
                    ) : teamRooms.length > 0 ? (
                        <div className="teamDashboard-rooms-list">
                            {teamRooms.map((room) => (
                                <div
                                    key={room.roomId}
                                    className="teamDashboard-room-item"
                                    onClick={() => navigate(`/workspace/${workspaceId}/team/${teamId}/room/${room.roomId}`)}
                                >
                                    <div className="teamDashboard-room-info">
                                        <div className="teamDashboard-room-name">{room.room?.[0]?.title || `Room ${room.roomId}`}</div>
                                        <div className="teamDashboard-room-meta">
                                            <span className="teamDashboard-room-date">생성일: {formatDate(room.createdAt)}</span>
                                            {room.room?.[0]?.lastMessageId ? (
                                                <span className="teamDashboard-last-message">
                                                    마지막 메시지: {roomMessages[room.roomId] || '로딩 중...'}
                                                </span>
                                            ) : (
                                                <span className="teamDashboard-last-message">
                                                    마지막 메시지: 없음
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="teamDashboard-room-arrow">→</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="teamDashboard-no-rooms">
                            <p>생성된 팀 채팅방이 없습니다.</p>
                            <button
                                onClick={createTeamRoom}
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
                                title="새 팀 채팅방 생성"
                            >
                                {roomsLoading ? '⟳' : '첫 번째 팀 채팅방 만들기'}
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* Task Edit Modal */}
            {showEditTaskModal && (
                <div className="teamDashboard-modal-overlay">
                    <div className="teamDashboard-modal">
                        <div className="teamDashboard-modal-header">
                            <h3>작업 편집</h3>
                            <button
                                className="teamDashboard-modal-close"
                                onClick={handleCancelTaskEdit}
                            >
                                ×
                            </button>
                        </div>
                        <div className="teamDashboard-modal-content">
                            <div className="teamDashboard-form-group">
                                <label>작업 이름</label>
                                <input
                                    type="text"
                                    value={editTaskFormData.task}
                                    onChange={(e) => setEditTaskFormData(prev => ({ ...prev, task: e.target.value }))}
                                    placeholder="작업 이름을 입력하세요"
                                    className="teamDashboard-form-input"
                                />
                            </div>
                            <div className="teamDashboard-form-group">
                                <label>우선순위</label>
                                <select
                                    value={editTaskFormData.priority}
                                    onChange={(e) => setEditTaskFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                                    className="teamDashboard-form-select"
                                >
                                    <option value="Low">낮음</option>
                                    <option value="Medium">보통</option>
                                    <option value="High">높음</option>
                                </select>
                            </div>
                            <div className="teamDashboard-form-group">
                                <label>상태</label>
                                <select
                                    value={editTaskFormData.state}
                                    onChange={(e) => setEditTaskFormData(prev => ({ ...prev, state: e.target.value as any }))}
                                    className="teamDashboard-form-select"
                                >
                                    <option value="To Do">할 일</option>
                                    <option value="In Progress">진행 중</option>
                                    <option value="Done">완료</option>
                                </select>
                            </div>
                        </div>
                        <div className="teamDashboard-modal-footer">
                            <button
                                className="teamDashboard-btn-secondary"
                                onClick={handleCancelTaskEdit}
                            >
                                취소
                            </button>
                            <button
                                className="teamDashboard-btn-primary"
                                onClick={handleSaveTaskEdit}
                                disabled={!editTaskFormData.task.trim()}
                            >
                                저장
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}