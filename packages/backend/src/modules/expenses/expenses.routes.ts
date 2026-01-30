import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { createExpenseSchema, updateExpenseSchema } from './expenses.schema.js';
import * as expensesController from './expenses.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', expensesController.findAll);
router.get('/by-category', expensesController.getByCategory);
router.get('/summary', expensesController.getSummary);
router.get('/:id', expensesController.findById);
router.post('/', validate(createExpenseSchema), expensesController.create);
router.patch('/:id', validate(updateExpenseSchema), expensesController.update);
router.delete('/:id', expensesController.remove);

export default router;
