import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { Priority } from '@prisma/client';

export class TaskController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.create(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientDate = req.query.date as string | undefined;
      const result = await TaskService.getTodayTasks(req.user!.id, clientDate);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUpcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = req.query.fromDate as string | undefined;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const result = await TaskService.getUpcomingTasks(req.user!.id, fromDate, days);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = {
        date: req.query.date as string | undefined,
        status: req.query.status as 'all' | 'pending' | 'completed' | undefined,
        goalId: req.query.goalId as string | undefined,
        category: req.query.category as string | undefined,
        priority: req.query.priority as Priority | undefined,
        search: req.query.search as string | undefined,
      };

      const tasks = await TaskService.getTasks(req.user!.id, filter);
      res.status(200).json({
        success: true,
        data: { tasks },
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleComplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const forcedState = req.body?.completed !== undefined ? Boolean(req.body.completed) : undefined;
      const result = await TaskService.toggleComplete(req.user!.id, req.params.id, forcedState);
      res.status(200).json({
        success: true,
        message: result.instance?.completed ? 'Task completed!' : 'Task uncompleted',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async completeTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.toggleComplete(req.user!.id, req.params.id, true);
      res.status(200).json({
        success: true,
        message: 'Task completed successfully!',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async uncompleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.toggleComplete(req.user!.id, req.params.id, false);
      res.status(200).json({
        success: true,
        message: 'Task uncompleted',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateInstance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await TaskService.updateInstance(req.user!.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: { task: updated },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteInstance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.deleteInstance(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.deleteTaskTemplate(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
