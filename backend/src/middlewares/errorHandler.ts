import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            res.status(409).json({ status: 'error', message: 'Duplicate value violates a unique constraint' });
            return;
        }

        if (err.code === 'P2025') {
            res.status(404).json({ status: 'error', message: 'Record not found' });
            return;
        }

        if (err.code === 'P2003') {
            res.status(400).json({ status: 'error', message: 'Operation violates a relation constraint' });
            return;
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        res.status(400).json({ status: 'error', message: 'Invalid database input' });
        return;
    }

    // Handle trusted operational errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
        return;
    }

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            status: 'fail',
            message: 'Validation error',
            errors: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Prevent leaking stack traces to the client in production
    const message =
        process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error';

    res.status(500).json({
        status: 'error',
        message,
    });
};