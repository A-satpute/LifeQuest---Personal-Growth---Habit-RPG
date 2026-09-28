import { Request, Response, NextFunction } from 'express';
import { GoalService } from '../services/goal.service';
import { GoalStatus } from '@prisma/client';

export class GoalController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goal = await GoalService.create(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as GoalStatus | undefined;
      const goals = await GoalService.getAll(req.user!.id, status);
      res.status(200).json({
        success: true,
        data: { goals },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goal = await GoalService.getById(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const goal = await GoalService.update(req.user!.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Goal updated successfully',
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.body.status as GoalStatus;
      const goal = await GoalService.updateStatus(req.user!.id, req.params.id, status);
      res.status(200).json({
        success: true,
        message: `Goal status updated to ${status}`,
        data: { goal },
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await GoalService.delete(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
