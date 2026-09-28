import { request } from './api';
import type { TaskInstance, TodayTasksResponse, CreateTaskPayload, UpdateTaskPayload, ToggleTaskResponse } from '../types/tasks';

export interface TaskQueryParams {
  date?: string;
  status?: 'all' | 'pending' | 'completed';
  goalId?: string;
  category?: string;
  priority?: string;
  search?: string;
}

export class TaskService {
  static async getTodayTasks(clientDate?: string): Promise<TodayTasksResponse> {
    const query = clientDate ? `?date=${clientDate}` : '';
    const res = await request<{ success: boolean; data: TodayTasksResponse }>(`/tasks/today${query}`);
    return res.data;
  }

  static async getUpcomingTasks(fromDate?: string, days = 7): Promise<{ window: { from: string; to: string }; total: number; tasks: TaskInstance[] }> {
    const query = new URLSearchParams();
    if (fromDate) query.append('fromDate', fromDate);
    if (days) query.append('days', days.toString());
    const res = await request<{ success: boolean; data: { window: { from: string; to: string }; total: number; tasks: TaskInstance[] } }>(`/tasks/upcoming?${query.toString()}`);
    return res.data;
  }

  static async getTasks(params: TaskQueryParams = {}): Promise<TaskInstance[]> {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.status) query.append('status', params.status);
    if (params.goalId) query.append('goalId', params.goalId);
    if (params.category) query.append('category', params.category);
    if (params.priority) query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString();
    const res = await request<{ success: boolean; data: { tasks: TaskInstance[] } }>(`/tasks${queryString ? `?${queryString}` : ''}`);
    return res.data.tasks;
  }

  static async createTask(payload: CreateTaskPayload): Promise<{ task: any; initialInstance: TaskInstance }> {
    const res = await request<{ success: boolean; data: { task: any; initialInstance: TaskInstance } }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  static async toggleComplete(instanceId: string, completed?: boolean): Promise<ToggleTaskResponse> {
    const res = await request<{ success: boolean; data: ToggleTaskResponse }>(`/tasks/instances/${instanceId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
    return res.data;
  }

  static async updateInstance(instanceId: string, payload: UpdateTaskPayload): Promise<TaskInstance> {
    const res = await request<{ success: boolean; data: { task: TaskInstance } }>(`/tasks/instances/${instanceId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data.task;
  }

  static async deleteInstance(instanceId: string): Promise<void> {
    await request(`/tasks/instances/${instanceId}`, {
      method: 'DELETE',
    });
  }

  static async deleteTaskTemplate(taskId: string): Promise<void> {
    await request(`/tasks/templates/${taskId}`, {
      method: 'DELETE',
    });
  }
}
