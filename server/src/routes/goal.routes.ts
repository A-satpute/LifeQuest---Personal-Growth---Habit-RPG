import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createGoalSchema, updateGoalSchema } from '../schemas/goal.schema';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createGoalSchema), GoalController.create);
router.get('/', GoalController.getAll);
router.get('/:id', GoalController.getById);
router.put('/:id', validateBody(updateGoalSchema), GoalController.update);
router.patch('/:id/status', GoalController.updateStatus);
router.delete('/:id', GoalController.delete);

export default router;
