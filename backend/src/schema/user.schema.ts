import { z } from 'zod';

export const updateUserSchema = z.object({
    body: z.object({
        firstName: z.string().trim().min(1, 'First name is required').optional(),
        lastName: z.string().trim().min(1, 'Last name is required').optional(),
        phone: z.preprocess(
            (value) => (value === '' || value === null ? undefined : value),
            z.string().trim().optional()
        ),
        role: z.enum(['ADMIN', 'PERFORMER']).optional(),
    }).refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];