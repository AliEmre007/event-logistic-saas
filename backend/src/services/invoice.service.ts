import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { CreateInvoiceInput, UpdateInvoiceStatusInput } from '../schema/invoice.schema';

export const getAllInvoices = async () => {
    return await prisma.invoice.findMany({
        include: { client: true, gig: true },
        orderBy: { createdAt: 'desc' },
    });
};

export const getInvoiceById = async (id: string) => {
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { client: true, gig: true },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
};

export const createInvoice = async (data: CreateInvoiceInput) => {
    const gig = await prisma.gig.findUnique({
        where: { id: data.gigId },
        include: { client: true },
    });

    if (!gig) throw new NotFoundError('Gig not found');

    // Verify gig doesn't already have an invoice
    const existingInvoice = await prisma.invoice.findUnique({
        where: { gigId: data.gigId },
    });

    if (existingInvoice) throw new BadRequestError('Invoice already exists for this gig');

    // Take a snapshot of billing details
    const billingSnapshot = `Client: ${gig.client.name}\nCompany: ${gig.client.companyName}\nAddress: ${gig.client.billingAddress}\nEmail: ${gig.client.email}`;

    return await prisma.invoice.create({
        data: {
            gigId: data.gigId,
            clientId: gig.clientId,
            amount: data.amount,
            dueDate: new Date(data.dueDate),
            billingDetails: billingSnapshot,
        },
    });
};

export const updateInvoiceStatus = async (id: string, data: UpdateInvoiceStatusInput) => {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundError('Invoice not found');

    return await prisma.invoice.update({
        where: { id },
        data: {
            status: data.status,
            paidAt: data.status === 'PAID' && invoice.status !== 'PAID' ? new Date() : undefined
        },
    });
};
