import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { updateUserSchema } from '../schema/user.schema';

const router = Router();

router.use(authenticate);
router.use(authorizeRole('ADMIN'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', validateRequest(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;