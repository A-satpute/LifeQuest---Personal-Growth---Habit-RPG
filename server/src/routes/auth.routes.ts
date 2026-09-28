import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, updateProfileSchema } from '../schemas/auth.schema';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateBody(registerSchema), AuthController.register);
router.post('/login', validateBody(loginSchema), AuthController.login);
router.get('/me', requireAuth, AuthController.getMe);
router.patch('/profile', requireAuth, validateBody(updateProfileSchema), AuthController.updateProfile);
router.put('/profile', requireAuth, validateBody(updateProfileSchema), AuthController.updateProfile);

export default router;
