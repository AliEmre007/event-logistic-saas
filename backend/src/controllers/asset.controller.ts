import { Request, Response, NextFunction } from 'express';
import * as assetService from '../services/asset.service';

export const getAllAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assets = await assetService.getAllAssets();
        res.status(200).json({ status: 'success', data: assets });
    } catch (error) {
        next(error);
    }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.getAssetById(req.params.id);
        res.status(200).json({ status: 'success', data: asset });
    } catch (error) {
        next(error);
    }
};

export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.createAsset(req.body);
        res.status(201).json({ status: 'success', data: asset });
    } catch (error) {
        next(error);
    }
};

export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.updateAsset(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: asset });
    } catch (error) {
        next(error);
    }
};

export const updateAssetState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const asset = await assetService.updateAssetState(req.params.id, req.body);
        res.status(200).json({ status: 'success', data: asset });
    } catch (error) {
        next(error);
    }
};

export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await assetService.deleteAsset(req.params.id);
        res.status(200).json({ status: 'success', message: 'Asset deleted' });
    } catch (error) {
        next(error);
    }
};
