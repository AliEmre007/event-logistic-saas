import { Router } from 'express';
import * as performerController from '../controllers/performer.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { createPerformerSchema, updatePerformerSchema } from '../schema/performer.schema';

const router = Router();

router.use(authenticate);

// List performers - available to all admins so they can assign them to gigs
router.get('/', authorizeRole('ADMIN'), performerController.getAllPerformers);
router.get('/:id', authorizeRole('ADMIN'), performerController.getPerformerById);

// Manage performer profiles - Admin only
router.post('/', authorizeRole('ADMIN'), validateRequest(createPerformerSchema), performerController.createPerformer);
router.put('/:id', authorizeRole('ADMIN'), validateRequest(updatePerformerSchema), performerController.updatePerformer);
router.delete('/:id', authorizeRole('ADMIN'), performerController.deletePerformer);

export default router;