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
        const locations = await prisma.location.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { gigs: true, assets: true } } },
        });
        res.json({ status: 'success', data: locations });
    } catch (error) { next(error); }
});

// GET location by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const location = await prisma.location.findUnique({
            where: { id: req.params.id },
            include: {
                gigs: { orderBy: { startTime: 'desc' }, take: 10 },
                assets: true,
            },
        });
        if (!location) return res.status(404).json({ status: 'error', message: 'Location not found' });
        res.json({ status: 'success', data: location });
    } catch (error) { next(error); }
});

// POST create location
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const location = await prisma.location.create({ data: req.body });
        res.status(201).json({ status: 'success', data: location });
    } catch (error) { next(error); }
});

// PUT update location
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const location = await prisma.location.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ status: 'success', data: location });
    } catch (error) { next(error); }
});

// DELETE location
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const gigCount = await prisma.gig.count({ where: { locationId: req.params.id } });
        if (gigCount > 0) {
            return res.status(409).json({
                status: 'error',
                message: `Cannot delete location: ${gigCount} gig(s) are linked. Remove or reassign them first.`,
            });
        }
        await prisma.location.delete({ where: { id: req.params.id } });
        res.json({ status: 'success', message: 'Location deleted' });
    } catch (error) { next(error); }
});

export default router;
