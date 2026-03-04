import { Router } from 'express';
import * as assetController from '../controllers/asset.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { createAssetSchema, updateAssetStateSchema } from '../schema/asset.schema';

const router = Router();

router.use(authenticate);

// View assets (all authenticated users)
router.get('/', assetController.getAllAssets);
router.get('/:id', assetController.getAssetById);

// Manage assets (Admin only)
router.use(authorizeRole('ADMIN'));
router.post('/', validateRequest(createAssetSchema), assetController.createAsset);
router.put('/:id', assetController.updateAsset);
router.patch('/:id/state', validateRequest(updateAssetStateSchema), assetController.updateAssetState);
router.delete('/:id', assetController.deleteAsset);

export default router;
