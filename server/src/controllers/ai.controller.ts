import { Request, Response, NextFunction } from 'express';
import { AiGoalService } from '../services/ai/aiGoal.service';

export class AiController {
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiGoalService.generatePlan(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'AI Roadmap blueprint generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async regenerate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiGoalService.regeneratePlan(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'AI Roadmap regenerated with guidance',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiGoalService.acceptPlan(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await AiGoalService.getPlan(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  static async dailySuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiGoalService.getDailySuggestions(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
