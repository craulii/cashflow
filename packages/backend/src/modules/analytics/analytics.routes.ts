import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import * as analyticsController from './analytics.controller.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', analyticsController.getDashboard);
router.get('/monthly', analyticsController.getMonthly);
router.get('/comparison', analyticsController.getComparison);
router.get('/trends', analyticsController.getTrends);

export default router;
