import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate);
router.use(authorizeRole('ADMIN'));

// GET all locations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const locations = await prisma.location.findMany({ orderBy: { name: 'asc' } });
        res.json({ status: 'success', data: locations });
    } catch (error) { next(error); }
});

// POST create location
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const location = await prisma.location.create({ data: req.body });
        res.status(201).json({ status: 'success', data: location });
    } catch (error) { next(error); }
});

export default router;
