import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { NotificationScheduler } from '../services/scheduler.service.js';
import { NotificationStatus } from '@prisma/client';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as NotificationStatus | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const result = await NotificationService.getNotifications(req.user!.id, {
        status,
        limit,
        offset,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await NotificationService.getUnreadCount(req.user!.id);
      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await NotificationService.markAsRead(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.id);
      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const prefs = await NotificationService.getOrCreatePreferences(req.user!.id);
      res.status(200).json({
        success: true,
        data: prefs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await NotificationService.updatePreferences(req.user!.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Notification preferences updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordDeliveryAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await NotificationService.recordBrowserDeliveryAttempt(req.user!.id, req.params.id);
      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async simulateRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetDate = req.body?.targetDate as string | undefined;
      const result = await NotificationService.evaluatePendingTasksForUser(req.user!.id, {
        forceEvaluation: true,
        targetDate,
      });

      res.status(200).json({
        success: true,
        message: result.notified ? 'Pending notification triggered' : 'No new notification required',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
