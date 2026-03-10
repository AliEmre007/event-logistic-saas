import { z } from 'zod';

const assetState = z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE_CLEANING', 'OUT_OF_SERVICE']);

export const createAssetSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Name is required'),
        sku: z.string().trim().min(1, 'SKU is required'),
        category: z.string().trim().min(1, 'Category is required'),
        locationId: z.string().uuid().optional(),
    }),
});

export const updateAssetSchema = z.object({
    body: z.object({
        name: z.string().trim().min(1, 'Name is required').optional(),
        sku: z.string().trim().min(1, 'SKU is required').optional(),
        category: z.string().trim().min(1, 'Category is required').optional(),
        locationId: z.string().uuid().nullable().optional(),
        state: assetState.optional(),
    }).refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});

export const updateAssetStateSchema = z.object({
    body: z.object({
        state: assetState,
    }),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>['body'];
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>['body'];
export type UpdateAssetStateInput = z.infer<typeof updateAssetStateSchema>['body'];