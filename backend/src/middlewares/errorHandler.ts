import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error(`[Error] ${err.name}: ${err.message}`);

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
