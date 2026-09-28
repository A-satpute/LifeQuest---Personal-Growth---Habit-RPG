import { Router, Request, Response, NextFunction } from 'express';
import { TaskController } from '../controllers/task.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema';

const router = Router();

router.use(requireAuth);

router.post('/', validateBody(createTaskSchema), TaskController.create);
router.get('/', TaskController.getTasks);
router.get('/today', TaskController.getToday);
router.get('/upcoming', TaskController.getUpcoming);

// Instance toggle & updates
router.patch('/instances/:id/toggle', TaskController.toggleComplete);
router.post('/instances/:id/complete', TaskController.completeTask);
router.post('/instances/:id/uncomplete', TaskController.uncompleteTask);
router.post('/:id/complete', TaskController.completeTask);
router.post('/:id/uncomplete', TaskController.uncompleteTask);
router.put('/instances/:id', validateBody(updateTaskSchema), TaskController.updateInstance);
router.delete('/instances/:id', TaskController.deleteInstance);

// Template management
router.delete('/templates/:id', TaskController.deleteTemplate);

export default router;
