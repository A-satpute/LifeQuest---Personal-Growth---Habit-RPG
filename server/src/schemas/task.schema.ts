import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, 'Task title must be at least 2 characters long').max(150, 'Task title is too long'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  goalId: z.string().uuid().optional().nullable(),
  category: z.string().trim().min(1).default('General'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Task date must be in YYYY-MM-DD format'),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Due time must be in HH:mm 24-hour format').optional().nullable(),
  
  // Recurrence configuration
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(['NONE', 'DAILY', 'WEEKLY', 'SELECTED_DAYS', 'CUSTOM']).default('NONE'),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).default([]),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
}).refine(
  (data) => {
    if (data.isRecurring && (data.recurrenceType === 'WEEKLY' || data.recurrenceType === 'SELECTED_DAYS')) {
      return data.recurrenceDays.length > 0;
    }
    return true;
  },
  {
    message: 'Please select at least one day for weekly recurring tasks',
    path: ['recurrenceDays'],
  }
);

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  goalId: z.string().uuid().optional().nullable(),
  category: z.string().trim().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  taskDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
