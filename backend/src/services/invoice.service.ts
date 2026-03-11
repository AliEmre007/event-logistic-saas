import { prisma } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { CreateInvoiceInput, UpdateInvoiceStatusInput } from '../schema/invoice.schema';

const companyScope = (companyId?: string | null) => (companyId ? { companyId } : {});

export const getAllInvoices = async (companyId?: string | null) => {
    return prisma.invoice.findMany({
        where: companyScope(companyId),
        include: { client: true, gig: true },
        orderBy: { createdAt: 'desc' },
    });
};

export const getInvoiceById = async (id: string, companyId?: string | null) => {
    const invoice = await prisma.invoice.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
        include: { client: true, gig: true },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    return invoice;
};

export const createInvoice = async (data: CreateInvoiceInput, companyId?: string | null) => {
    const gig = await prisma.gig.findFirst({
        where: {
            id: data.gigId,
            ...companyScope(companyId),
        },
        include: { client: true },
    });

    if (!gig) throw new NotFoundError('Gig not found');

    // Verify gig doesn't already have an invoice
    const existingInvoice = await prisma.invoice.findFirst({
        where: {
            gigId: data.gigId,
            ...companyScope(companyId),
        },
    });

    if (existingInvoice) throw new BadRequestError('Invoice already exists for this gig');

    // Take a snapshot of billing details
    const billingSnapshot = `Client: ${gig.client.name}\nCompany: ${gig.client.companyName}\nAddress: ${gig.client.billingAddress}\nEmail: ${gig.client.email}`;

    return prisma.invoice.create({
        data: {
            gigId: data.gigId,
            clientId: gig.clientId,
            companyId: companyId || gig.companyId || undefined,
            amount: data.amount,
            dueDate: new Date(data.dueDate),
            billingDetails: billingSnapshot,
        },
    });
};

export const updateInvoiceStatus = async (id: string, data: UpdateInvoiceStatusInput, companyId?: string | null) => {
    const invoice = await prisma.invoice.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');

    return prisma.invoice.update({
        where: { id },
        data: {
            status: data.status,
            paidAt: data.status === 'PAID' && invoice.status !== 'PAID' ? new Date() : undefined,
        },
    });
};

export const deleteInvoice = async (id: string, companyId?: string | null) => {
    const invoice = await prisma.invoice.findFirst({
        where: {
            id,
            ...companyScope(companyId),
        },
    });
    if (!invoice) throw new NotFoundError('Invoice not found');
    if (invoice.status === 'PAID') {
        throw new BadRequestError('Cannot delete a paid invoice');
    }
    await prisma.invoice.delete({ where: { id } });
};