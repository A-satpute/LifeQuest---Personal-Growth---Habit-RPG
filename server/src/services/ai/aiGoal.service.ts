import { prisma } from '../../db/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import {
  GenerateGoalPlanInput,
  RegenerateGoalPlanInput,
  AcceptGoalPlanInput,
  DailySuggestionsInput,
  aiTaskItemSchema,
  aiMilestoneItemSchema,
} from '../../schemas/ai.schema.js';
import { GeminiAIProvider } from './geminiProvider.js';
import { HeuristicAIProvider } from './heuristicProvider.js';
import { AIProvider, StructuredPlanOutput } from './aiProvider.interface.js';
import { GoalService } from '../goal.service.js';
import { TaskService } from '../task.service.js';
import { getGamificationProfile } from '../gamification.service.js';
import { env } from '../../config/env.js';
import { z } from 'zod';
import crypto from 'crypto';

// Strict schema for validating AI provider output
const rawAiOutputSchema = z.object({
  goalTitle: z.string().min(1).max(120),
  category: z.string().default('Learning'),
  summary: z.string().min(1),
  estimatedDuration: z.string().default('60 days'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  milestones: z.array(aiMilestoneItemSchema).min(1),
  tasks: z.array(aiTaskItemSchema).min(1),
  recommendations: z.array(z.string()).default([]),
});

export class AiGoalService {
  private static provider: AIProvider = new GeminiAIProvider();

  /**
   * Allows swapping the AI provider implementation dynamically
   */
  static setProvider(newProvider: AIProvider) {
    this.provider = newProvider;
  }

  /**
   * Generates a new structured goal roadmap from a user prompt
   */
  static async generatePlan(userId: string, input: GenerateGoalPlanInput) {
    // 1. Call AI Provider
    const rawOutput = await this.provider.generateRoadmap(input);

    // 2. Validate structured output with Zod
    const parsed = rawAiOutputSchema.safeParse(rawOutput);
    if (!parsed.success) {
      console.error('AI generated invalid output:', parsed.error.format());
      throw new AppError('AI provider returned malformed plan. Please try again.', 502);
    }

    const validatedData = parsed.data;

    // 3. Rate limiting & Cost protection: Enforce maximum generated task limit
    if (validatedData.tasks.length > env.AI_MAX_TASKS) {
      validatedData.tasks = validatedData.tasks.slice(0, env.AI_MAX_TASKS);
    }

    // 4. Store draft plan in database
    const planRecord = await prisma.aiPlan.create({
      data: {
        userId,
        prompt: input.prompt,
        goalTitle: validatedData.goalTitle,
        category: validatedData.category,
        targetDate: input.targetDate || null,
        skillLevel: input.skillLevel,
        availableTimePerDay: input.availableTimePerDay,
        daysPerWeek: input.daysPerWeek,
        summary: validatedData.summary,
        estimatedDuration: validatedData.estimatedDuration,
        planData: validatedData as any,
        status: 'DRAFT',
      },
    });

    return {
      id: planRecord.id,
      planId: planRecord.id,
      status: planRecord.status,
      plan: validatedData,
      planData: validatedData,
      goalTitle: validatedData.goalTitle,
      category: validatedData.category,
      summary: validatedData.summary,
      estimatedDuration: validatedData.estimatedDuration,
    };
  }

  /**
   * Regenerates a plan incorporating user guidance notes
   */
  static async regeneratePlan(userId: string, input: RegenerateGoalPlanInput) {
    const existing = await prisma.aiPlan.findUnique({
      where: { id: input.planId },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError('AI plan not found or unauthorized', 404);
    }

    const generatePayload: GenerateGoalPlanInput = {
      prompt: existing.prompt,
      category: existing.category,
      targetDate: input.targetDate || existing.targetDate || undefined,
      skillLevel: (existing.skillLevel as any) || 'Beginner',
      availableTimePerDay: input.availableTimePerDay || existing.availableTimePerDay || 60,
      daysPerWeek: input.daysPerWeek || existing.daysPerWeek || 5,
      preferredDifficulty: 'MEDIUM' as const,
      priority: 'HIGH' as const,
      existingKnowledge: undefined,
    };

    // Call provider with guidance notes
    const rawOutput = await this.provider.generateRoadmap({
      ...generatePayload,
      guidanceNotes: input.guidanceNotes,
    });

    const parsed = rawAiOutputSchema.safeParse(rawOutput);
    if (!parsed.success) {
      throw new AppError('AI provider returned malformed plan during regeneration', 502);
    }

    const validatedData = parsed.data;
    if (validatedData.tasks.length > env.AI_MAX_TASKS) {
      validatedData.tasks = validatedData.tasks.slice(0, env.AI_MAX_TASKS);
    }

    const updatedRecord = await prisma.aiPlan.update({
      where: { id: input.planId },
      data: {
        goalTitle: validatedData.goalTitle,
        category: validatedData.category,
        summary: validatedData.summary,
        estimatedDuration: validatedData.estimatedDuration,
        planData: validatedData as any,
        status: 'DRAFT',
      },
    });

    return {
      id: updatedRecord.id,
      planId: updatedRecord.id,
      status: updatedRecord.status,
      plan: validatedData,
      planData: validatedData,
      goalTitle: validatedData.goalTitle,
      category: validatedData.category,
      summary: validatedData.summary,
      estimatedDuration: validatedData.estimatedDuration,
    };
  }

  /**
   * Accepts an AI plan: transforms user-confirmed/edited items into real Goals and Tasks
   * using the existing Phase 2 & Phase 3 architecture
   */
  static async acceptPlan(userId: string, input: AcceptGoalPlanInput) {
    const planRecord = await prisma.aiPlan.findUnique({
      where: { id: input.planId },
    });

    if (!planRecord || planRecord.userId !== userId) {
      throw new AppError('AI plan not found or unauthorized', 404);
    }

    if (planRecord.status === 'ACCEPTED') {
      throw new AppError('AI plan has already been accepted', 400);
    }

    // 1. Create real Goal using existing GoalService
    const title = input.goalTitle || planRecord.goalTitle;
    const category = input.category || planRecord.category;
    const today = new Date().toISOString().split('T')[0];

    const createdGoal = await GoalService.create(userId, {
      title,
      description: input.goalDescription || planRecord.summary,
      category,
      priority: input.priority || 'MEDIUM',
      startDate: input.startDate || today,
      endDate: input.endDate || input.targetDate || planRecord.targetDate || undefined,
    });

    // 2. Create Tasks using existing TaskService
    let createdTasksCount = 0;
    const createdTasks = [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (const taskItem of input.selectedTasks) {
      if (taskItem.selected === false) continue; // Respect user unchecks

      const taskResult = await TaskService.create(userId, {
        title: taskItem.title,
        description: taskItem.description || null,
        category: taskItem.category || category,
        priority: taskItem.priority || 'MEDIUM',
        goalId: createdGoal.id,
        isRecurring: Boolean(taskItem.isRecurring),
        recurrenceType: taskItem.recurrenceType || 'NONE',
        recurrenceDays: taskItem.recurrenceDays || [],
        taskDate: taskItem.suggestedDate || todayStr,
      });

      createdTasks.push(taskResult.task);
      createdTasksCount++;
    }

    // 3. Mark AI plan as ACCEPTED and record the created goal ID
    await prisma.aiPlan.update({
      where: { id: input.planId },
      data: {
        status: 'ACCEPTED',
        acceptedGoalId: createdGoal.id,
      },
    });

    return {
      success: true,
      message: `Goal "${createdGoal.title}" created with ${createdTasksCount} actionable tasks!`,
      goal: createdGoal,
      tasks: createdTasks,
      createdTasksCount,
    };
  }

  /**
   * Retrieves an AI plan by ID with ownership verification
   */
  static async getPlan(userId: string, planId: string) {
    const plan = await prisma.aiPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.userId !== userId) {
      throw new AppError('AI plan not found or unauthorized', 404);
    }

    return plan;
  }

  /**
   * Generates grounded daily suggestions analyzing the user's actual data
   */
  static async getDailySuggestions(userId: string, input: Partial<DailySuggestionsInput> = {}) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const todayDate = new Date().toISOString().split('T')[0];

    // Gather real context from existing services
    const [todayData, activeGoals, profile] = await Promise.all([
      TaskService.getTodayTasks(userId, todayDate),
      GoalService.getAll(userId, 'ACTIVE'),
      getGamificationProfile(userId),
    ]);

    const context = {
      userName: user.name,
      streak: profile.character.currentStreak,
      level: profile.character.level,
      todayDate,
      todayTasks: todayData.tasks.map((t) => ({
        title: t.title,
        category: t.category,
        completed: t.completed,
        priority: t.priority,
      })),
      activeGoals: activeGoals.map((g) => ({
        title: g.title,
        category: g.category,
        progress: g.progress,
        endDate: g.endDate ? g.endDate.toISOString().split('T')[0] : null,
      })),
      timeAvailableMinutes: input.timeAvailableMinutes,
      focusCategory: input.focusCategory,
    };

    return await this.provider.generateDailySuggestions(context);
  }
}
