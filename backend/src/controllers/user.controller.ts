import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsers(req.user?.companyId);
        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        next(error);
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.getUserById(req.params.id, req.user?.companyId);
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body, req.user!.id, req.user?.companyId);
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await userService.deleteUser(req.params.id, req.user!.id, req.user?.companyId);
        res.status(200).json({ status: 'success', message: 'User deleted' });
    } catch (error) {
        next(error);
    }
};