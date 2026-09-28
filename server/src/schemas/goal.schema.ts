import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters long').max(100, 'Title is too long'),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  category: z.string().trim().min(1).default('Personal'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).default(() => new Date().toISOString()),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
}).refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
    }
    return true;
  },
  {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
  }
);

export const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  category: z.string().trim().min(1).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
}).refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime();
    }
    return true;
  },
  {
    message: 'End date cannot be earlier than start date',
    path: ['endDate'],
  }
);

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
