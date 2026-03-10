import { z } from 'zod';

const optionalText = z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.string().trim().optional()
);

const clientShape = {
    name: z.string().trim().min(1, 'Client name is required'),
    companyName: optionalText,
    email: z.string().trim().email('Invalid email address'),
    phone: optionalText,
    billingAddress: optionalText,
};

export const createClientSchema = z.object({
    body: z.object(clientShape),
});

export const updateClientSchema = z.object({
    body: z.object(clientShape).partial().refine((value) => Object.keys(value).length > 0, {
        message: 'At least one field is required',
    }),
});

export type CreateClientInput = z.infer<typeof createClientSchema>['body'];
export type UpdateClientInput = z.infer<typeof updateClientSchema>['body'];