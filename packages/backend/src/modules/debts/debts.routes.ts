import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { createDebtSchema, updateDebtSchema, createPaymentSchema } from './debts.schema.js';
import * as debtsController from './debts.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', debtsController.findAll);
router.get('/summary', debtsController.getSummary);
router.get('/:id', debtsController.findById);
router.post('/', validate(createDebtSchema), debtsController.create);
router.patch('/:id', validate(updateDebtSchema), debtsController.update);
router.delete('/:id', debtsController.remove);

// Payment routes
router.get('/:id/payments', debtsController.getPayments);
router.post('/:id/payments', validate(createPaymentSchema), debtsController.addPayment);
router.delete('/payments/:paymentId', debtsController.deletePayment);

export default router;
