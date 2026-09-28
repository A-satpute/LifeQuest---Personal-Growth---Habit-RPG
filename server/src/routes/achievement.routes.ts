import { Router } from 'express';
import { AchievementController } from '../controllers/achievement.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All achievement endpoints require authentication
router.use(requireAuth);

router.get('/', AchievementController.getAll);
router.post('/evaluate', AchievementController.evaluate);

export default router;
