import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { getJwtSecret } from '../config/env';

// Extend Express Request interface to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        let token;

        // Check headers for authorization token
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            throw new UnauthorizedError('You are not logged in. Please log in to get access.');
        }

        // Verify token
        const decoded = jwt.verify(token, getJwtSecret()) as { id: string; role: string };

        // Check if user still exists
        const currentUser = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, role: true },
        });

        if (!currentUser) {
            throw new UnauthorizedError('The user belonging to this token no longer exists.');
        }

        // Grant access to protected route
        req.user = currentUser;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid token. Please log in again.'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Your token has expired! Please log in again.'));
        } else {
            next(error);
        }
    }
};

export const authorizeRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            next(new ForbiddenError('You do not have permission to perform this action'));
            return;
        }
        next();
    };
};