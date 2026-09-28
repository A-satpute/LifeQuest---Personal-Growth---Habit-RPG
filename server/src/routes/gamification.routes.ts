import { Router } from 'express';
import { GamificationController } from '../controllers/gamification.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/profile', GamificationController.getProfile);
router.get('/xp', GamificationController.getXP);
router.get('/stats', GamificationController.getStats);
router.get('/streak', GamificationController.getStreak);
router.get('/character', GamificationController.getCharacter);
router.get('/', GamificationController.getCharacter);
router.patch('/gender', GamificationController.updateGender);
router.patch('/character/gender', GamificationController.updateGender);

export default router;
