import { Request, Response, NextFunction } from 'express';
import { AchievementService } from '../services/achievement.service';

export class AchievementController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AchievementService.getUserAchievements(req.user!.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newlyUnlocked = await AchievementService.evaluateAchievements(req.user!.id);
      res.status(200).json({
        success: true,
        newlyUnlockedCount: newlyUnlocked.length,
        newlyUnlocked,
      });
    } catch (error) {
      next(error);
    }
  }
}
