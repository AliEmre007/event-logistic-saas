import { Router } from 'express';
import * as gigController from '../controllers/gig.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { createGigSchema, assignPerformerSchema, assignAssetSchema } from '../schema/gig.schema';

const router = Router();

router.use(authenticate);

// Read operations — any authenticated user
router.get('/', gigController.getAllGigs);
router.get('/:id', gigController.getGigById);

// Write operations — Admin only
router.use(authorizeRole('ADMIN'));
router.post('/', validateRequest(createGigSchema), gigController.createGig);
router.put('/:id', gigController.updateGig);
router.delete('/:id', gigController.deleteGig);
router.post('/:id/assign-performer', validateRequest(assignPerformerSchema), gigController.assignPerformer);
router.post('/:id/assign-asset', validateRequest(assignAssetSchema), gigController.assignAsset);
router.delete('/:id/assignments/:assignmentId', gigController.removePerformerAssignment);
router.delete('/:id/assets/:gigAssetId', gigController.removeAssetAssignment);

export default router;
