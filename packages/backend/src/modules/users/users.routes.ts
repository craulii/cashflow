import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { updateUserSchema } from './users.schema.js';
import * as usersController from './users.controller.js';

const router = Router();

router.use(authenticate);

router.get('/me', usersController.getProfile);
router.patch('/me', validate(updateUserSchema), usersController.updateProfile);

export default router;
