import { z } from 'zod';

export const createPerformerSchema = z.object({
    body: z.object({
        userId: z.string().uuid('Invalid user id'),
        skills: z.array(z.string().trim().min(1)).default([]),
    }),
});

export const updatePerformerSchema = z.object({
    body: z.object({
        skills: z.array(z.string().trim().min(1)).optional(),
        active: z.boolean().optional(),
    }).refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});

export type CreatePerformerInput = z.infer<typeof createPerformerSchema>['body'];
export type UpdatePerformerInput = z.infer<typeof updatePerformerSchema>['body'];