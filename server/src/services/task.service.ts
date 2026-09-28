import { prisma } from '../db/prisma';
import { AppError } from '../middlewares/errorHandler';
import { CreateTaskInput, UpdateTaskInput } from '../schemas/task.schema';
import { Priority, RecurrenceType } from '@prisma/client';
import { completeTaskInstance, uncompleteTaskInstance } from './gamification.service';

export interface TaskFilterOptions {
  date?: string;
  status?: 'all' | 'pending' | 'completed';
  goalId?: string;
  category?: string;
  priority?: Priority;
  search?: string;
}

export class TaskService {
  /**
   * Helper to normalize a date string to YYYY-MM-DD
   */
  static normalizeDate(dateStr?: string): string {
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toISOString().split('T')[0];
  }

  /**
   * Helper to determine day of week for a YYYY-MM-DD string (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
   */
  static getDayOfWeek(dateStr: string): number {
    const [year, month, day] = dateStr.split('-').map(Number);
    // UTC day of week for the specific date components
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCDay();
  }

  /**
   * Materialize recurring tasks for a specific date idempotently
   */
  static async materializeRecurringTasksForDate(userId: string, targetDate: string): Promise<void> {
    const dayOfWeek = this.getDayOfWeek(targetDate);

    // Find all active recurring tasks for this user
    const recurringTasks = await prisma.task.findMany({
      where: {
        userId,
        isActive: true,
        isRecurring: true,
      },
    });

    for (const task of recurringTasks) {
      // Check start and end date bounds
      const taskStartStr = this.normalizeDate(task.startDate.toISOString());
      if (targetDate < taskStartStr) continue;

      if (task.endDate) {
        const taskEndStr = this.normalizeDate(task.endDate.toISOString());
        if (targetDate > taskEndStr) continue;
      }

      // Check recurrence rules
      let shouldOccur = false;
      if (task.recurrenceType === RecurrenceType.DAILY) {
        shouldOccur = true;
      } else if (
        task.recurrenceType === RecurrenceType.WEEKLY ||
        task.recurrenceType === RecurrenceType.SELECTED_DAYS ||
        task.recurrenceType === RecurrenceType.CUSTOM
      ) {
        shouldOccur = task.recurrenceDays.includes(dayOfWeek);
      }

      if (shouldOccur) {
        // Upsert instance to prevent duplicates and preserve completion state
        await prisma.taskInstance.upsert({
          where: {
            taskId_taskDate: {
              taskId: task.id,
              taskDate: targetDate,
            },
          },
          create: {
            taskId: task.id,
            userId,
            goalId: task.goalId,
            title: task.title,
            description: task.description,
            category: task.category,
            priority: task.priority,
            taskDate: targetDate,
            dueTime: task.dueTime,
            completed: false,
          },
          update: {}, // preserve state
        });
      }
    }
  }

  /**
   * Create a new task (one-off or recurring template)
   */
  static async create(userId: string, input: CreateTaskInput) {
    // If linked to goal, ensure goal belongs to user
    if (input.goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: input.goalId },
      });
      if (!goal || goal.userId !== userId) {
        throw new AppError('Linked goal not found or does not belong to you', 400);
      }
    }

    const taskDate = this.normalizeDate(input.taskDate);

    // 1. Create parent Task record
    const parentTask = await prisma.task.create({
      data: {
        userId,
        goalId: input.goalId || null,
        title: input.title,
        description: input.description || null,
        category: input.category,
        priority: input.priority,
        isRecurring: input.isRecurring,
        recurrenceType: input.recurrenceType,
        recurrenceDays: input.recurrenceDays,
        startDate: new Date(`${taskDate}T00:00:00.000Z`),
        endDate: input.endDate ? new Date(input.endDate) : null,
        dueTime: input.dueTime || null,
        isActive: true,
      },
    });

    // 2. If it's a one-off task, immediately create its concrete TaskInstance
    if (!input.isRecurring) {
      const instance = await prisma.taskInstance.create({
        data: {
          taskId: parentTask.id,
          userId,
          goalId: parentTask.goalId,
          title: parentTask.title,
          description: parentTask.description,
          category: parentTask.category,
          priority: parentTask.priority,
          taskDate,
          dueTime: parentTask.dueTime,
          completed: false,
        },
      });

      // Recalculate goal progress if goal attached
      if (parentTask.goalId) {
        await this.recalculateGoalProgress(parentTask.goalId);
      }

      return {
        task: parentTask,
        initialInstance: instance,
      };
    } else {
      // For recurring task, materialize for today if scheduled today
      await this.materializeRecurringTasksForDate(userId, taskDate);
      const instance = await prisma.taskInstance.findUnique({
        where: {
          taskId_taskDate: {
            taskId: parentTask.id,
            taskDate,
          },
        },
      });

      return {
        task: parentTask,
        initialInstance: instance,
      };
    }
  }

  /**
   * Get Today's tasks for the user (materializes recurring tasks automatically)
   */
  static async getTodayTasks(userId: string, clientDate?: string) {
    const today = this.normalizeDate(clientDate);
    await this.materializeRecurringTasksForDate(userId, today);

    const instances = await prisma.taskInstance.findMany({
      where: {
        userId,
        taskDate: today,
      },
      include: {
        goal: {
          select: { id: true, title: true, category: true, priority: true },
        },
        task: {
          select: { isRecurring: true, recurrenceType: true },
        },
      },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { dueTime: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const total = instances.length;
    const completed = instances.filter((t) => t.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      date: today,
      stats: {
        total,
        completed,
        pending: total - completed,
        completionPercentage: percentage,
      },
      tasks: instances,
    };
  }

  /**
   * Get upcoming tasks for the next N days
   */
  static async getUpcomingTasks(userId: string, fromDateStr?: string, daysAhead = 7) {
    const fromDate = this.normalizeDate(fromDateStr);
    const startDateObj = new Date(fromDate);

    // Materialize recurring tasks across the upcoming window
    const dateStrings: string[] = [];
    for (let i = 1; i <= daysAhead; i++) {
      const nextDate = new Date(startDateObj);
      nextDate.setDate(nextDate.getDate() + i);
      const nextDateStr = nextDate.toISOString().split('T')[0];
      dateStrings.push(nextDateStr);
      await this.materializeRecurringTasksForDate(userId, nextDateStr);
    }

    const instances = await prisma.taskInstance.findMany({
      where: {
        userId,
        taskDate: {
          in: dateStrings,
        },
      },
      include: {
        goal: {
          select: { id: true, title: true, category: true, priority: true },
        },
        task: {
          select: { isRecurring: true, recurrenceType: true },
        },
      },
      orderBy: [
        { taskDate: 'asc' },
        { completed: 'asc' },
        { priority: 'desc' },
      ],
    });

    return {
      window: {
        from: dateStrings[0],
        to: dateStrings[dateStrings.length - 1],
      },
      total: instances.length,
      tasks: instances,
    };
  }

  /**
   * General task instance query with filters
   */
  static async getTasks(userId: string, options: TaskFilterOptions) {
    if (options.date) {
      await this.materializeRecurringTasksForDate(userId, options.date);
    }

    const where: any = { userId };

    if (options.date) {
      where.taskDate = options.date;
    }

    if (options.status === 'completed') {
      where.completed = true;
    } else if (options.status === 'pending') {
      where.completed = false;
    }

    if (options.goalId) {
      where.goalId = options.goalId;
    }

    if (options.category) {
      where.category = options.category;
    }

    if (options.priority) {
      where.priority = options.priority;
    }

    if (options.search) {
      where.title = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    const instances = await prisma.taskInstance.findMany({
      where,
      include: {
        goal: {
          select: { id: true, title: true, category: true, priority: true },
        },
        task: {
          select: { isRecurring: true, recurrenceType: true },
        },
      },
      orderBy: [
        { taskDate: 'desc' },
        { completed: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return instances;
  }

  /**
   * Toggle task instance completion state with full gamification flow (XP, stats, streaks, level, daily bonus)
   */
  static async toggleComplete(userId: string, instanceId: string, forcedState?: boolean) {
    const instance = await prisma.taskInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || instance.userId !== userId) {
      throw new AppError('Task instance not found or unauthorized', 404);
    }

    const shouldComplete = forcedState !== undefined ? forcedState : !instance.completed;

    let gamificationResult;
    if (shouldComplete) {
      gamificationResult = await completeTaskInstance(instanceId, userId);
    } else {
      gamificationResult = await uncompleteTaskInstance(instanceId, userId);
    }

    const updatedInstance = await prisma.taskInstance.findUnique({
      where: { id: instanceId },
      include: {
        goal: {
          select: { id: true, title: true, progress: true },
        },
      },
    });

    return {
      instance: updatedInstance,
      goalProgress: gamificationResult.goalProgress,
      gamification: gamificationResult,
    };
  }

  /**
   * Recalculates goal progress dynamically based on completed / total task instances
   */
  static async recalculateGoalProgress(goalId: string): Promise<number> {
    const total = await prisma.taskInstance.count({
      where: { goalId },
    });

    const completed = await prisma.taskInstance.count({
      where: { goalId, completed: true },
    });

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await prisma.goal.update({
      where: { id: goalId },
      data: { progress },
    });

    return progress;
  }

  /**
   * Update a task instance (or its details)
   */
  static async updateInstance(userId: string, instanceId: string, input: UpdateTaskInput) {
    const instance = await prisma.taskInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || instance.userId !== userId) {
      throw new AppError('Task instance not found or unauthorized', 404);
    }

    if (input.goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: input.goalId },
      });
      if (!goal || goal.userId !== userId) {
        throw new AppError('Linked goal does not belong to you', 400);
      }
    }

    const updated = await prisma.taskInstance.update({
      where: { id: instanceId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.dueTime !== undefined && { dueTime: input.dueTime }),
        ...(input.goalId !== undefined && { goalId: input.goalId }),
        ...(input.taskDate !== undefined && { taskDate: input.taskDate }),
        ...(input.completed !== undefined && {
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
        }),
      },
      include: {
        goal: true,
      },
    });

    if (updated.goalId) {
      await this.recalculateGoalProgress(updated.goalId);
    }

    return updated;
  }

  /**
   * Delete a task instance
   */
  static async deleteInstance(userId: string, instanceId: string) {
    const instance = await prisma.taskInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || instance.userId !== userId) {
      throw new AppError('Task instance not found or unauthorized', 404);
    }

    await prisma.taskInstance.delete({
      where: { id: instanceId },
    });

    if (instance.goalId) {
      await this.recalculateGoalProgress(instance.goalId);
    }

    return { message: 'Task instance deleted successfully' };
  }

  /**
   * Delete parent task template (cascades to all future instances)
   */
  static async deleteTaskTemplate(userId: string, taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new AppError('Task template not found or unauthorized', 404);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    if (task.goalId) {
      await this.recalculateGoalProgress(task.goalId);
    }

    return { message: 'Task and all associated instances deleted' };
  }
}
