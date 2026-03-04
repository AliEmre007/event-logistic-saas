import { Request, Response, NextFunction } from 'express';
import * as gigService from '../services/gig.service';

export const getAllGigs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gigs = await gigService.getAllGigs();
        res.status(200).json({ status: 'success', data: gigs });
    } catch (error) {
        next(error);
    }
};

export const createGig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gig = await gigService.createGig(req.body);
        res.status(201).json({ status: 'success', data: gig });
    } catch (error) {
        next(error);
    }
};

export const getGigById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gig = await gigService.getGigById(req.params.id);
        res.status(200).json({ status: 'success', data: gig });
    } catch (error) {
        next(error);
    }
};

export const updateGig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gig = await gigService.updateGig(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: gig });
    } catch (error) {
        next(error);
    }
};

export const deleteGig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await gigService.deleteGig(req.params.id);
        res.status(200).json({ status: 'success', message: 'Gig deleted' });
    } catch (error) {
        next(error);
    }
};

export const assignPerformer = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assignment = await gigService.assignPerformer(req.params.id, req.body);
        res.status(201).json({ status: 'success', data: assignment });
    } catch (error) {
        next(error);
    }
};

export const assignAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assetAssignment = await gigService.assignAsset(req.params.id, req.body);
        res.status(201).json({ status: 'success', data: assetAssignment });
    } catch (error) {
        next(error);
    }
};

export const removePerformerAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await gigService.removePerformerAssignment(req.params.id, req.params.assignmentId);
        res.status(200).json({ status: 'success', message: 'Performer unassigned' });
    } catch (error) {
        next(error);
    }
};

export const removeAssetAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await gigService.removeAssetAssignment(req.params.id, req.params.gigAssetId);
        res.status(200).json({ status: 'success', message: 'Asset unassigned' });
    } catch (error) {
        next(error);
    }
};
