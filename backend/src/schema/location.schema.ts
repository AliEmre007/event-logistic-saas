import { z } from 'zod';

export const createLocationSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Location name is required'),
        address: z.string().trim().min(1, 'Address is required'),
    }),
});

export const updateLocationSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Location name is required').optional(),
        address: z.string().trim().min(1, 'Address is required').optional(),
    }).refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>['body'];
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>['body'];