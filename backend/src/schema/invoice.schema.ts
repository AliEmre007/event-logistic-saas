import { z } from 'zod';

const dueDateSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'Invalid due date format',
});

export const createInvoiceSchema = z.object({
    body: z.object({
        gigId: z.string().uuid(),
        amount: z.number().positive(),
        dueDate: dueDateSchema,
    }),
});

export const updateInvoiceStatusSchema = z.object({
    body: z.object({
        status: z.enum(['PENDING', 'PAID', 'OVERDUE']),
    }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>['body'];