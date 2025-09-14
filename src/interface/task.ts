const task_states_enum = ['Done', 'In Progress', 'To Do']
const task_priority_enum = ['High', 'Low', 'Medium']

export interface TaskCreateRequest {
    state: typeof task_states_enum[number];
    priority: typeof task_priority_enum[number];
    task: string;
}

export interface TaskByTaskCreateRequest {
    title: string;
    content: string;
    tags: string[];
    attachments_path: string[];
}

export interface CommentCreateRequest {
    content: string;
    parent_id: number | null;
}