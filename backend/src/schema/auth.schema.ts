import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email({ message: 'Invalid email address' }),
        password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
        firstName: z.string().min(1, { message: 'First name is required' }),
        lastName: z.string().min(1, { message: 'Last name is required' }),
        phone: z.string().optional(),
        role: z.enum(['ADMIN', 'PERFORMER']).default('PERFORMER'),
        skills: z.array(z.string()).optional(), // specific to performer
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email({ message: 'Invalid email address' }),
        password: z.string().min(1, { message: 'Password is required' }),
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
