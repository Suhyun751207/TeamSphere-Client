import api from "../Api";
import { TaskCreateRequest, TaskByTaskCreateRequest, CommentCreateRequest } from "../../interface/task";

function taskBase(workspaceId: number, teamId: number) {
    return `/v1/workspace/${workspaceId}/teams/${teamId}/tasks`;
}

async function getTeamTasks(workspaceId: number, teamId: number) {
    return api.get(taskBase(workspaceId, teamId));
}

async function createTask(workspaceId: number, teamId: number, taskData: TaskCreateRequest) {
    return api.post(taskBase(workspaceId, teamId), taskData);
}

async function taskMember(workspaceId: number, teamId: number, memberId: number) {
    return api.get(`${taskBase(workspaceId, teamId)}/${memberId}`);
}

async function updateTask(workspaceId: number, teamId: number, tasksId: number, taskData: TaskCreateRequest) {
    return api.patch(`${taskBase(workspaceId, teamId)}/${tasksId}`, taskData);
}

async function TasksIdByGetTask(workspaceId: number, teamId: number, tasksId: number) {
    return api.get(`${taskBase(workspaceId, teamId)}/${tasksId}/task`);
}

async function TasksIdByCreateTask(workspaceId: number, teamId: number, tasksId: number, data: TaskByTaskCreateRequest) {
    return api.post(`${taskBase(workspaceId, teamId)}/${tasksId}/task`, data);
}

async function TasksIdByGetTaskId(workspaceId: number, teamId: number, tasksId: number, taskId: number) {
    return api.get(`${taskBase(workspaceId, teamId)}/${tasksId}/task/${taskId}`);
}

async function TasksIdByUpdateTaskId(workspaceId: number, teamId: number, tasksId: number, taskId: number, data: TaskByTaskCreateRequest) {
    return api.patch(`${taskBase(workspaceId, teamId)}/${tasksId}/task/${taskId}`, data);
}

async function getComments(workspaceId: number, teamId: number, tasksId: number, taskId: number) {
    return api.get(`${taskBase(workspaceId, teamId)}/${tasksId}/task/${taskId}/comments`);
}

async function createComment(workspaceId: number, teamId: number, tasksId: number, taskId: number, data: CommentCreateRequest) {
    return api.post(`${taskBase(workspaceId, teamId)}/${tasksId}/task/${taskId}/comments`, data);
}

async function getCommentsId(workspaceId: number, teamId: number, tasksId: number, taskId: number, commentsId: number) {
    return api.get(`${taskBase(workspaceId, teamId)}/${tasksId}/task/${taskId}/comments/${commentsId}`);
}

async function updateComment(workspaceId: number, teamId: number, tasksId: number, taskId: number, commentsId: number, data: CommentCreateRequest) {
    return api.patch(`${taskBase(workspaceId, teamId)}/${tasksId}/task/${taskId}/comments/${commentsId}`, data);
}

const TaskService = {
    getTeamTasks,
    createTask,
    taskMember,
    updateTask,
    TasksIdByGetTask,
    TasksIdByCreateTask,
    TasksIdByGetTaskId,
    TasksIdByUpdateTaskId,
    getComments,
    createComment,
    getCommentsId,
    updateComment,
};

export default TaskService;
