import { Request, Response, NextFunction } from 'express';
import * as invoiceService from '../services/invoice.service';

export const getAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoices = await invoiceService.getAllInvoices(req.user?.companyId);
        res.status(200).json({ status: 'success', data: invoices });
    } catch (error) {
        next(error);
    }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id, req.user?.companyId);
        res.status(200).json({ status: 'success', data: invoice });
    } catch (error) {
        next(error);
    }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await invoiceService.createInvoice(req.body, req.user?.companyId);
        res.status(201).json({ status: 'success', data: invoice });
    } catch (error) {
        next(error);
    }
};

export const updateInvoiceStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invoice = await invoiceService.updateInvoiceStatus(req.params.id, req.body, req.user?.companyId);
        res.status(200).json({ status: 'success', data: invoice });
    } catch (error) {
        next(error);
    }
};

export const deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await invoiceService.deleteInvoice(req.params.id, req.user?.companyId);
        res.status(200).json({ status: 'success', message: 'Invoice deleted' });
    } catch (error) {
        next(error);
    }
};