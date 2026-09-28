import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  generateGoalPlanSchema,
  regenerateGoalPlanSchema,
  acceptGoalPlanSchema,
  dailySuggestionsSchema,
} from '../schemas/ai.schema';

const router = Router();

// All AI routes require authentication
router.use(requireAuth);

// Generate structured roadmap draft
router.post('/goals/generate', validateBody(generateGoalPlanSchema), AiController.generate);

// Regenerate an existing plan preview with new guidance
router.post('/goals/regenerate', validateBody(regenerateGoalPlanSchema), AiController.regenerate);

// Accept plan preview and materialize real Goal + Task records in DB
router.post('/goals/accept', validateBody(acceptGoalPlanSchema), AiController.accept);

// Get specific AI plan by ID (ownership protected)
router.get('/plans/:id', AiController.getPlan);

// Daily AI suggestions based on live user data
router.post('/daily-suggestions', validateBody(dailySuggestionsSchema), AiController.dailySuggestions);

export default router;
