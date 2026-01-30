import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { createCategorySchema, updateCategorySchema } from './categories.schema.js';
import * as categoriesController from './categories.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', categoriesController.findAll);
router.get('/:id', categoriesController.findById);
router.post('/', validate(createCategorySchema), categoriesController.create);
router.patch('/:id', validate(updateCategorySchema), categoriesController.update);
router.delete('/:id', categoriesController.remove);

export default router;
