import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || '30d';
      const timezone = req.query.timezone as string | undefined;

      const data = await AnalyticsService.getOverview(req.user!.id, range, timezone);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || '30d';
      const timezone = req.query.timezone as string | undefined;

      const data = await AnalyticsService.getCompletionTrends(req.user!.id, range, timezone);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getXp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || '30d';

      const data = await AnalyticsService.getXpTrends(req.user!.id, range);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHeatmap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const timezone = req.query.timezone as string | undefined;

      const data = await AnalyticsService.getActivityHeatmap(req.user!.id, year, timezone);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getGoals(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getGoalsAnalytics(req.user!.id);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate, goalId, category, status } = req.query;

      const data = await AnalyticsService.getTaskHistory(req.user!.id, {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        goalId: goalId as string | undefined,
        category: category as string | undefined,
        status: status as any,
      });

      res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const timezone = req.query.timezone as string | undefined;

      const data = await AnalyticsService.getMonthCalendar(req.user!.id, year, month, timezone);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

