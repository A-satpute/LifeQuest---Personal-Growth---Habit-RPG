import { request } from './api';
import type {
  AiPlan,
  GenerateGoalPlanPayload,
  RegenerateGoalPlanPayload,
  AcceptGoalPlanPayload,
  DailySuggestionsData,
} from '../types/ai';

export class AiService {
  /**
   * Generates a structured roadmap blueprint based on user prompt
   */
  static async generatePlan(payload: GenerateGoalPlanPayload): Promise<AiPlan> {
    const res = await request<{ success: boolean; data: AiPlan }>('/ai/goals/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  /**
   * Regenerates a roadmap blueprint incorporating additional guidance notes
   */
  static async regeneratePlan(payload: RegenerateGoalPlanPayload): Promise<AiPlan> {
    const res = await request<{ success: boolean; data: AiPlan }>('/ai/goals/regenerate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  /**
   * Accepts user-reviewed roadmap and materializes concrete Goal and Tasks in database
   */
  static async acceptPlan(payload: AcceptGoalPlanPayload): Promise<{
    goal: any;
    tasks: any[];
    createdTasksCount: number;
    message: string;
  }> {
    const res = await request<{
      success: boolean;
      data: { goal: any; tasks: any[]; createdTasksCount: number; message: string };
    }>('/ai/goals/accept', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  }

  /**
   * Retrieves an AI plan by ID
   */
  static async getPlan(planId: string): Promise<AiPlan> {
    const res = await request<{ success: boolean; data: AiPlan }>(`/ai/plans/${planId}`);
    return res.data;
  }

  /**
   * Fetches daily action suggestions grounded in user's active goals and tasks
   */
  static async getDailySuggestions(params?: {
    availableMinutes?: number;
    focusPreference?: string;
  }): Promise<DailySuggestionsData> {
    const res = await request<{ success: boolean; data: DailySuggestionsData }>(
      '/ai/daily-suggestions',
      {
        method: 'POST',
        body: JSON.stringify(params || {}),
      }
    );
    return res.data;
  }
}
