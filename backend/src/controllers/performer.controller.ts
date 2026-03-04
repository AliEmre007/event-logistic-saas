import { Request, Response, NextFunction } from 'express';
import * as performerService from '../services/performer.service';

export const getAllPerformers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const performers = await performerService.getAllPerformers();
        res.status(200).json({ status: 'success', data: performers });
    } catch (error) {
        next(error);
    }
};

export const getPerformerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const performer = await performerService.getPerformerById(req.params.id);
        res.status(200).json({ status: 'success', data: performer });
    } catch (error) {
        next(error);
    }
};

export const createPerformer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const performer = await performerService.createPerformer(req.body);
        res.status(201).json({ status: 'success', data: performer });
    } catch (error) {
        next(error);
    }
};

export const updatePerformer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const performer = await performerService.updatePerformer(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: performer });
    } catch (error) {
        next(error);
    }
};

export const deletePerformer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await performerService.deletePerformer(req.params.id);
        res.status(200).json({ status: 'success', message: 'Performer profile deleted' });
    } catch (error) {
        next(error);
    }
};
