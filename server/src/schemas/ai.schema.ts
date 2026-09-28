import { z } from 'zod';
import { Priority, RecurrenceType } from '@prisma/client';

export const generateGoalPlanSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Goal prompt must be at least 3 characters')
    .max(500, 'Goal prompt cannot exceed 500 characters'),
  category: z.string().optional().default('Personal'),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'targetDate must be in YYYY-MM-DD format')
    .optional(),
  skillLevel: z
    .string()
    .optional()
    .default('Beginner')
    .transform((val) => {
      const v = (val || 'Beginner').toUpperCase();
      if (v === 'INTERMEDIATE') return 'Intermediate';
      if (v === 'ADVANCED') return 'Advanced';
      return 'Beginner';
    }),
  availableTimePerDay: z.number().int().min(5).max(480).optional().default(60),
  daysPerWeek: z.number().int().min(1).max(7).optional().default(5),
  preferredDifficulty: z
    .string()
    .optional()
    .default('MEDIUM')
    .transform((v) => (v || 'MEDIUM').toUpperCase())
    .pipe(z.enum(['EASY', 'MEDIUM', 'HARD'])),
  existingKnowledge: z.string().max(500).optional(),
  priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
});

export const regenerateGoalPlanSchema = z.object({
  planId: z.string().uuid('Invalid planId'),
  guidanceNotes: z.string().max(500, 'Guidance notes cannot exceed 500 characters').optional(),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'targetDate must be in YYYY-MM-DD format')
    .optional(),
  availableTimePerDay: z.number().int().min(5).max(480).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
});

export const aiTaskItemSchema = z.object({
  id: z.string(),
  milestoneId: z.string().optional(),
  title: z.string().min(1).max(150),
  description: z.string().max(500).optional().nullable(),
  category: z.string().default('General'),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  estimatedMinutes: z.number().int().min(5).max(480).default(30),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.nativeEnum(RecurrenceType).default(RecurrenceType.NONE),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).default([]),
  suggestedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'suggestedDate must be in YYYY-MM-DD format')
    .optional(),
  selected: z.boolean().optional().default(true),
});

export const aiMilestoneItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  description: z.string().max(400).optional().nullable(),
  order: z.number().int().min(1),
  targetDate: z.string().optional(),
});

export const acceptGoalPlanSchema = z
  .object({
    planId: z.string().uuid('Invalid planId'),
    goalTitle: z.string().min(1).max(120).optional(),
    goalDescription: z.string().max(500).optional(),
    category: z.string().optional(),
    priority: z.nativeEnum(Priority).optional().default(Priority.MEDIUM),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    targetDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    selectedTasks: z.array(aiTaskItemSchema).optional(),
    tasks: z.array(aiTaskItemSchema).optional(),
  })
  .transform((data) => {
    const chosenTasks = data.selectedTasks || data.tasks || [];
    return {
      ...data,
      selectedTasks: chosenTasks,
    };
  });

export const dailySuggestionsSchema = z
  .object({
    timeAvailableMinutes: z.number().int().min(5).max(480).optional(),
    availableMinutes: z.number().int().min(5).max(480).optional(),
    focusCategory: z.string().optional(),
    focusPreference: z.string().optional(),
  })
  .transform((data) => ({
    timeAvailableMinutes: data.availableMinutes ?? data.timeAvailableMinutes,
    focusCategory: data.focusPreference ?? data.focusCategory,
  }));

export type GenerateGoalPlanInput = z.infer<typeof generateGoalPlanSchema>;
export type RegenerateGoalPlanInput = z.infer<typeof regenerateGoalPlanSchema>;
export type AcceptGoalPlanInput = z.infer<typeof acceptGoalPlanSchema>;
export type DailySuggestionsInput = z.infer<typeof dailySuggestionsSchema>;
export type AiTaskItem = z.infer<typeof aiTaskItemSchema>;
export type AiMilestoneItem = z.infer<typeof aiMilestoneItemSchema>;
