import { request } from './api';
import type { Goal, GoalStatus, CreateGoalPayload, UpdateGoalPayload } from '../types/goals';

export class GoalService {
  static async getGoals(status?: GoalStatus): Promise<Goal[]> {
    const query = status ? `?status=${status}` : '';
    const res = await request<{ success: boolean; data: { goals: Goal[] } }>(`/goals${query}`);
    return res.data.goals;
  }

  static async getGoalById(id: string): Promise<Goal> {
    const res = await request<{ success: boolean; data: { goal: Goal } }>(`/goals/${id}`);
    return res.data.goal;
  }

  static async createGoal(payload: CreateGoalPayload): Promise<Goal> {
    const res = await request<{ success: boolean; data: { goal: Goal } }>('/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data.goal;
  }

  static async updateGoal(id: string, payload: UpdateGoalPayload): Promise<Goal> {
    const res = await request<{ success: boolean; data: { goal: Goal } }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data.goal;
  }

  static async updateGoalStatus(id: string, status: GoalStatus): Promise<Goal> {
    const res = await request<{ success: boolean; data: { goal: Goal } }>(`/goals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data.goal;
  }

  static async deleteGoal(id: string): Promise<void> {
    await request(`/goals/${id}`, {
      method: 'DELETE',
    });
  }
}
