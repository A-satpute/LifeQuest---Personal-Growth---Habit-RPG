import { AiTaskItem, AiMilestoneItem } from '../../schemas/ai.schema.js';

export interface StructuredPlanOutput {
  goalTitle: string;
  category: string;
  summary: string;
  estimatedDuration: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  milestones: AiMilestoneItem[];
  tasks: AiTaskItem[];
  recommendations: string[];
}

export interface DailySuggestionItem {
  id: string;
  title: string;
  reason: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedMinutes: number;
  relatedGoalTitle?: string | null;
}

export interface DailySuggestionsOutput {
  greeting: string;
  focusTheme: string;
  suggestions: DailySuggestionItem[];
  motivationalQuote: string;
}

export interface AIProvider {
  name: string;
  generateRoadmap(input: {
    prompt: string;
    category?: string;
    targetDate?: string;
    skillLevel?: string;
    availableTimePerDay?: number;
    daysPerWeek?: number;
    preferredDifficulty?: string;
    guidanceNotes?: string;
  }): Promise<StructuredPlanOutput>;

  generateDailySuggestions(context: {
    userName: string;
    streak: number;
    level: number;
    todayDate: string;
    todayTasks: Array<{ title: string; category: string; completed: boolean; priority: string }>;
    activeGoals: Array<{ title: string; category: string; progress: number; endDate: string | null }>;
    timeAvailableMinutes?: number;
    focusCategory?: string;
  }): Promise<DailySuggestionsOutput>;
}
