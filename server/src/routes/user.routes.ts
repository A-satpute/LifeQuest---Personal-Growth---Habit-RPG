import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateProfileSchema } from '../schemas/auth.schema';

const router = Router();

router.get('/profile', requireAuth, AuthController.getMe);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), AuthController.updateProfile);
router.patch('/profile', requireAuth, validateBody(updateProfileSchema), AuthController.updateProfile);

export default router;
