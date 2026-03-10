import { z } from 'zod';

const baseGigShape = {
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().optional(),
    startTime: z.string().datetime({ message: 'Invalid start time format' }),
    endTime: z.string().datetime({ message: 'Invalid end time format' }),
    clientId: z.string().uuid(),
    locationId: z.string().uuid(),
};

export const createGigSchema = z.object({
    body: z.object(baseGigShape).refine((data) => new Date(data.startTime) < new Date(data.endTime), {
        message: 'End time cannot be before start time',
        path: ['endTime'],
    }),
});

export const updateGigSchema = z.object({
    body: z.object({
        title: z.string().trim().min(1, 'Title is required').optional(),
        description: z.string().optional(),
        startTime: z.string().datetime({ message: 'Invalid start time format' }).optional(),
        endTime: z.string().datetime({ message: 'Invalid end time format' }).optional(),
        clientId: z.string().uuid().optional(),
        locationId: z.string().uuid().optional(),
        status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
    })
        .refine((data) => Object.keys(data).length > 0, {
            message: 'At least one field is required',
        })
        .refine((data) => {
            if (!data.startTime || !data.endTime) return true;
            return new Date(data.startTime) < new Date(data.endTime);
        }, {
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
export type UpdateGigInput = z.infer<typeof updateGigSchema>['body'];
export type AssignPerformerInput = z.infer<typeof assignPerformerSchema>['body'];
export type AssignAssetInput = z.infer<typeof assignAssetSchema>['body'];