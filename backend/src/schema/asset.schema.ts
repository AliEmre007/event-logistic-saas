import { z } from 'zod';

export const createAssetSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        sku: z.string().min(1, 'SKU is required'),
        category: z.string().min(1, 'Category is required'),
        locationId: z.string().uuid().optional(),
    }),
});

export const updateAssetStateSchema = z.object({
    body: z.object({
        state: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE_CLEANING', 'OUT_OF_SERVICE']),
    }),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>['body'];
export type UpdateAssetStateInput = z.infer<typeof updateAssetStateSchema>['body'];
