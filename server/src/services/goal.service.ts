import { prisma } from '../db/prisma';
import { AppError } from '../middlewares/errorHandler';
import { CreateGoalInput, UpdateGoalInput } from '../schemas/goal.schema';
import { AchievementService } from './achievement.service';
import { GoalStatus } from '@prisma/client';

export class GoalService {
  static async create(userId: string, input: CreateGoalInput) {
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        status: GoalStatus.ACTIVE,
        progress: 0,
      },
    });

    return goal;
  }

  static async getAll(userId: string, statusFilter?: GoalStatus) {
    const where: any = { userId };
    if (statusFilter) {
      where.status = statusFilter;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            tasks: true,
            taskInstances: true,
          },
        },
      },
    });

    // Compute dynamic progress for each goal from TaskInstances
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const totalInstances = await prisma.taskInstance.count({
          where: { goalId: goal.id, userId },
        });

        const completedInstances = await prisma.taskInstance.count({
          where: { goalId: goal.id, userId, completed: true },
        });

        const calculatedProgress =
          totalInstances > 0 ? Math.round((completedInstances / totalInstances) * 100) : goal.progress;

        return {
          ...goal,
          progress: calculatedProgress,
          metrics: {
            totalTasks: totalInstances,
            completedTasks: completedInstances,
            pendingTasks: totalInstances - completedInstances,
          },
        };
      })
    );

    return goalsWithProgress;
  }

  static async getById(userId: string, goalId: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        taskInstances: {
          orderBy: { taskDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found or unauthorized', 404);
    }

    const totalInstances = await prisma.taskInstance.count({
      where: { goalId: goal.id, userId },
    });

    const completedInstances = await prisma.taskInstance.count({
      where: { goalId: goal.id, userId, completed: true },
    });

    const calculatedProgress =
      totalInstances > 0 ? Math.round((completedInstances / totalInstances) * 100) : goal.progress;

    return {
      ...goal,
      progress: calculatedProgress,
      metrics: {
        totalTasks: totalInstances,
        completedTasks: completedInstances,
        pendingTasks: totalInstances - completedInstances,
      },
    };
  }

  static async update(userId: string, goalId: string, input: UpdateGoalInput) {
    const existing = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError('Goal not found or unauthorized', 404);
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.startDate !== undefined && { startDate: new Date(input.startDate) }),
        ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
      },
    });

    return updated;
  }

  static async updateStatus(userId: string, goalId: string, status: GoalStatus) {
    const existing = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError('Goal not found or unauthorized', 404);
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: {
        status,
        ...(status === GoalStatus.COMPLETED ? { progress: 100 } : {}),
      },
    });

    if (status === GoalStatus.COMPLETED) {
      AchievementService.evaluateAchievements(userId).catch((err) => {
        console.error('Error evaluating achievements on goal completion:', err);
      });
    }

    return updated;
  }

  static async delete(userId: string, goalId: string) {
    const existing = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!existing || existing.userId !== userId) {
      throw new AppError('Goal not found or unauthorized', 404);
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { message: 'Goal deleted successfully' };
  }
}

/**
 * Recalculates goal progress dynamically based on completed / total task instances
 */
export async function recalculateGoalProgress(goalId: string, tx: any = prisma): Promise<number> {
  const total = await tx.taskInstance.count({
    where: { goalId },
  });

  const completed = await tx.taskInstance.count({
    where: { goalId, completed: true },
  });

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  await tx.goal.update({
    where: { id: goalId },
    data: { progress },
  });

  return progress;
}
