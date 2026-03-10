import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateRequest';
import { createClientSchema, updateClientSchema } from '../schema/client.schema';
import { prisma } from '../lib/prisma';
import { Request, Response, NextFunction } from 'express';

const router = Router();

router.use(authenticate);
router.use(authorizeRole('ADMIN'));

// GET all clients
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { gigs: true, invoices: true } } },
        });
        res.json({ status: 'success', data: clients });
    } catch (error) {
        next(error);
    }
});

// GET client by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client = await prisma.client.findUnique({
            where: { id: req.params.id },
            include: {
                gigs: { orderBy: { startTime: 'desc' }, take: 10 },
                invoices: { orderBy: { issuedAt: 'desc' }, take: 10 },
            },
        });
        if (!client) return res.status(404).json({ status: 'error', message: 'Client not found' });
        res.json({ status: 'success', data: client });
    } catch (error) {
        next(error);
    }
});

// POST create client
router.post('/', validateRequest(createClientSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client = await prisma.client.create({ data: req.body });
        res.status(201).json({ status: 'success', data: client });
    } catch (error) {
        next(error);
    }
});

// PUT update client
router.put('/:id', validateRequest(updateClientSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client = await prisma.client.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json({ status: 'success', data: client });
    } catch (error) {
        next(error);
    }
});

// DELETE client
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Check for existing gigs
        const gigCount = await prisma.gig.count({ where: { clientId: req.params.id } });
        if (gigCount > 0) {
            return res.status(409).json({
                status: 'error',
                message: `Cannot delete client: ${gigCount} gig(s) are linked. Remove or reassign them first.`,
            });
        }
        await prisma.client.delete({ where: { id: req.params.id } });
        res.json({ status: 'success', message: 'Client deleted' });
    } catch (error) {
        next(error);
    }
});

export default router;