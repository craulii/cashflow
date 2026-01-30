import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { createIncomeSchema, updateIncomeSchema } from './income.schema.js';
import * as incomeController from './income.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', incomeController.findAll);
router.get('/summary', incomeController.getSummary);
router.get('/:id', incomeController.findById);
router.post('/', validate(createIncomeSchema), incomeController.create);
router.patch('/:id', validate(updateIncomeSchema), incomeController.update);
router.delete('/:id', incomeController.remove);

export default router;
