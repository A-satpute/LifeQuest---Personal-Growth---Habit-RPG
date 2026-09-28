import type { Priority } from './goals';
import type { RecurrenceType } from './tasks';

export interface AiMilestone {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  targetDate?: string;
}

export interface AiTaskItem {
  id: string;
  milestoneId?: string;
  title: string;
  description?: string | null;
  category: string;
  priority: Priority;
  estimatedMinutes: number;
  isRecurring: boolean;
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];
  suggestedDate?: string;
  selected?: boolean;
}

export interface AiPlanData {
  goalTitle: string;
  category: string;
  summary: string;
  estimatedDuration: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  milestones: AiMilestone[];
  tasks: AiTaskItem[];
  recommendations: string[];
}

export interface AiPlan {
  id: string;
  userId: string;
  prompt: string;
  goalTitle: string;
  category: string;
  targetDate?: string | null;
  skillLevel: string;
  availableTimePerDay: number;
  daysPerWeek: number;
  summary: string;
  estimatedDuration: string;
  planData: AiPlanData;
  status: 'DRAFT' | 'ACCEPTED' | 'DISCARDED';
  acceptedGoalId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateGoalPlanPayload {
  prompt: string;
  category?: string;
  targetDate?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  availableTimePerDay?: number;
  daysPerWeek?: number;
  preferredDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  existingKnowledge?: string;
  priority?: Priority;
}

export interface RegenerateGoalPlanPayload {
  planId: string;
  guidanceNotes?: string;
  targetDate?: string;
  availableTimePerDay?: number;
  daysPerWeek?: number;
}

export interface AcceptGoalPlanPayload {
  planId: string;
  goalTitle?: string;
  goalDescription?: string;
  category?: string;
  priority?: Priority;
  startDate?: string;
  endDate?: string;
  targetDate?: string;
  selectedTasks: AiTaskItem[];
}

export interface DailySuggestionItem {
  id: string;
  title: string;
  reason: string;
  category: string;
  priority: Priority;
  estimatedMinutes: number;
  relatedGoalTitle?: string | null;
}

export interface DailySuggestionsData {
  greeting: string;
  focusTheme: string;
  suggestions: DailySuggestionItem[];
  motivationalQuote: string;
}
