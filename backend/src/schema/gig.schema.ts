import { z } from 'zod';

export const createGigSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        startTime: z.string().datetime({ message: 'Invalid start time format' }),
        endTime: z.string().datetime({ message: 'Invalid end time format' }),
        clientId: z.string().uuid(),
        locationId: z.string().uuid(),
    }).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
        message: 'End time cannot be before start time',
        path: ['endTime'],
    }),
});

export const assignPerformerSchema = z.object({
    body: z.object({
        performerProfileId: z.string().uuid(),
    }),
});

export const assignAssetSchema = z.object({
    body: z.object({
        assetId: z.string().uuid(),
    }),
});

export type CreateGigInput = z.infer<typeof createGigSchema>['body'];
export type AssignPerformerInput = z.infer<typeof assignPerformerSchema>['body'];
export type AssignAssetInput = z.infer<typeof assignAssetSchema>['body'];
