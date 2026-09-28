import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All analytics endpoints require authentication
router.use(requireAuth);

router.get('/overview', AnalyticsController.getOverview);
router.get('/completion', AnalyticsController.getCompletion);
router.get('/xp', AnalyticsController.getXp);
router.get('/heatmap', AnalyticsController.getHeatmap);
router.get('/goals', AnalyticsController.getGoals);
router.get('/history', AnalyticsController.getHistory);
router.get('/calendar', AnalyticsController.getCalendar);

export default router;
