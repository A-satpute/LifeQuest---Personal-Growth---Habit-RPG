import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(50, 'Name must be under 50 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters long').max(100, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  bio: z.string().max(250, 'Bio must be under 250 characters').optional().nullable(),
  avatarUrl: z
    .string()
    .max(7000000, 'Profile image payload exceeds size limit')
    .refine(
      (val) => !val || val === '' || val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://'),
      { message: 'Avatar must be a valid image data URI or URL' }
    )
    .optional()
    .nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
