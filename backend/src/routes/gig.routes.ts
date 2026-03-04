import { Router } from 'express';
import * as gigController from '../controllers/gig.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { createGigSchema, assignPerformerSchema, assignAssetSchema } from '../schema/gig.schema';

const router = Router();

// Secure all gig routes
router.use(authenticate);

// Admin & Performers can view
router.get('/', gigController.getAllGigs);
router.get('/:id', gigController.getGigById);

// Only Admins can create or modify assignments
router.use(authorizeRole('ADMIN'));

router.post('/', validateRequest(createGigSchema), gigController.createGig);
router.post('/:id/assign-performer', validateRequest(assignPerformerSchema), gigController.assignPerformer);
router.post('/:id/assign-asset', validateRequest(assignAssetSchema), gigController.assignAsset);

export default router;
