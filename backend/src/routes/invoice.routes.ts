import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, authorizeRole } from '../middlewares/authMiddleware';
import { createInvoiceSchema, updateInvoiceStatusSchema } from '../schema/invoice.schema';

const router = Router();

router.use(authenticate);
router.use(authorizeRole('ADMIN'));

router.get('/', invoiceController.getAllInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', validateRequest(createInvoiceSchema), invoiceController.createInvoice);
router.patch('/:id/status', validateRequest(updateInvoiceStatusSchema), invoiceController.updateInvoiceStatus);
router.delete('/:id', invoiceController.deleteInvoice);

export default router;
