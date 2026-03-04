import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { prisma } from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate);
router.use(authorizeRole('ADMIN'));

// GET all clients
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
        res.json({ status: 'success', data: clients });
    } catch (error) { next(error); }
});

// POST create client
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client = await prisma.client.create({ data: req.body });
        res.status(201).json({ status: 'success', data: client });
    } catch (error) { next(error); }
});

export default router;
