import { Request, Response, NextFunction } from 'express';
import { getGamificationProfile, updateCharacterGender } from '../services/gamification.service';

export class GamificationController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await getGamificationProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getXP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await getGamificationProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          level: data.character.level,
          stage: data.character.stage,
          currentXP: data.character.currentXP,
          totalXP: data.character.totalXP,
          levelInfo: data.levelInfo,
          recentTransactions: data.recentTransactions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await getGamificationProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          characterId: data.character.id,
          stage: data.character.stage,
          level: data.character.level,
          stats: data.stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStreak(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await getGamificationProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          currentStreak: data.character.currentStreak,
          longestStreak: data.character.longestStreak,
          lastActiveDate: data.character.lastActiveDate,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCharacter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await getGamificationProfile(req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          character: data.character,
          stats: data.stats,
          levelInfo: data.levelInfo,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateGender(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { gender } = req.body;
      if (!gender || (gender !== 'MALE' && gender !== 'FEMALE')) {
        res.status(400).json({ success: false, message: 'Gender must be MALE or FEMALE' });
        return;
      }
      const updated = await updateCharacterGender(req.user!.id, gender);
      res.status(200).json({
        success: true,
        message: 'Character gender updated successfully',
        data: { character: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}


