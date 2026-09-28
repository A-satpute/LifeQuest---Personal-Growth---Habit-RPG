import { PrismaClient, Priority, GoalStatus, RecurrenceType, XPReason } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Seeding database for Phase 2...');

  const demoEmail = 'hero@lifequest.com';
  let user = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  const passwordHash = await bcrypt.hash('HeroPassword123!', 12);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Alex Vance',
        passwordHash,
        bio: 'Self-improvement enthusiast on a journey to level up in life and fitness.',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
      },
    });
    console.log(`[Seed] Created demo user: ${user.email} (Password: HeroPassword123!)`);
  } else {
    console.log(`[Seed] Demo user found: ${user.email}`);
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Create Goal 1: Fitness
  let fitnessGoal = await prisma.goal.findFirst({
    where: { userId: user.id, title: { contains: 'Fitness' } },
  });

  if (!fitnessGoal) {
    fitnessGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Build Muscle & Fitness Consistency',
        description: 'Complete 4 workouts a week, maintain clean nutrition, and drink 3L water daily.',
        category: 'Fitness',
        priority: Priority.HIGH,
        status: GoalStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
    });
    console.log('[Seed] Created Fitness Goal');
  }

  // Create Goal 2: Learning
  let learningGoal = await prisma.goal.findFirst({
    where: { userId: user.id, title: { contains: 'TypeScript' } },
  });

  if (!learningGoal) {
    learningGoal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: 'Master Full-Stack TypeScript & React Architecture',
        description: 'Study modern patterns, component design systems, and PostgreSQL indexing.',
        category: 'Learning',
        priority: Priority.HIGH,
        status: GoalStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('[Seed] Created Learning Goal');
  }

  // Task 1: Recurring Daily Hydration
  let hydrationTask = await prisma.task.findFirst({
    where: { userId: user.id, title: { contains: 'Drink' } },
  });

  if (!hydrationTask) {
    hydrationTask = await prisma.task.create({
      data: {
        userId: user.id,
        goalId: fitnessGoal.id,
        title: 'Drink 3L Hydration Water',
        description: 'Stay hydrated throughout the day.',
        category: 'Health',
        priority: Priority.MEDIUM,
        isRecurring: true,
        recurrenceType: RecurrenceType.DAILY,
        recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
        dueTime: '08:00',
        startDate: new Date(),
      },
    });

    await prisma.taskInstance.upsert({
      where: {
        taskId_taskDate: {
          taskId: hydrationTask.id,
          taskDate: todayStr,
        },
      },
      create: {
        taskId: hydrationTask.id,
        userId: user.id,
        goalId: fitnessGoal.id,
        title: hydrationTask.title,
        description: hydrationTask.description,
        category: hydrationTask.category,
        priority: hydrationTask.priority,
        taskDate: todayStr,
        dueTime: '08:00',
        completed: true,
        completedAt: new Date(),
      },
      update: {},
    });
    console.log('[Seed] Created Hydration Recurring Task');
  }

  // Task 2: Workout Routine (Mon, Wed, Fri)
  let workoutTask = await prisma.task.findFirst({
    where: { userId: user.id, title: { contains: 'Workout' } },
  });

  if (!workoutTask) {
    workoutTask = await prisma.task.create({
      data: {
        userId: user.id,
        goalId: fitnessGoal.id,
        title: '45-Min Resistance Gym Workout',
        description: 'Upper body hypertrophy focus with progressive overload.',
        category: 'Fitness',
        priority: Priority.HIGH,
        isRecurring: true,
        recurrenceType: RecurrenceType.WEEKLY,
        recurrenceDays: [1, 3, 5],
        dueTime: '17:30',
        startDate: new Date(),
      },
    });

    await prisma.taskInstance.upsert({
      where: {
        taskId_taskDate: {
          taskId: workoutTask.id,
          taskDate: todayStr,
        },
      },
      create: {
        taskId: workoutTask.id,
        userId: user.id,
        goalId: fitnessGoal.id,
        title: workoutTask.title,
        description: workoutTask.description,
        category: workoutTask.category,
        priority: workoutTask.priority,
        taskDate: todayStr,
        dueTime: '17:30',
        completed: false,
      },
      update: {},
    });
    console.log('[Seed] Created Workout Task');
  }

  // Task 3: Study Task
  let studyTask = await prisma.task.findFirst({
    where: { userId: user.id, title: { contains: 'TypeScript' } },
  });

  if (!studyTask) {
    studyTask = await prisma.task.create({
      data: {
        userId: user.id,
        goalId: learningGoal.id,
        title: 'Build TypeScript API Endpoints',
        description: 'Implement controllers, service layers, and Zod validation schemas.',
        category: 'Learning',
        priority: Priority.HIGH,
        isRecurring: false,
        dueTime: '14:00',
        startDate: new Date(),
      },
    });

    await prisma.taskInstance.upsert({
      where: {
        taskId_taskDate: {
          taskId: studyTask.id,
          taskDate: todayStr,
        },
      },
      create: {
        taskId: studyTask.id,
        userId: user.id,
        goalId: learningGoal.id,
        title: studyTask.title,
        description: studyTask.description,
        category: studyTask.category,
        priority: studyTask.priority,
        taskDate: todayStr,
        dueTime: '14:00',
        completed: true,
        completedAt: new Date(),
      },
      update: {},
    });
    console.log('[Seed] Created TypeScript Study Task');
  }

  // Task 4: Reading Clean Code (Independent task)
  let readingTask = await prisma.task.findFirst({
    where: { userId: user.id, title: { contains: 'Clean Code' } },
  });

  if (!readingTask) {
    readingTask = await prisma.task.create({
      data: {
        userId: user.id,
        goalId: null, // independent!
        title: 'Read 20 Pages of Clean Code Book',
        description: 'Focus on meaningful names and function boundaries.',
        category: 'Routine',
        priority: Priority.MEDIUM,
        isRecurring: false,
        dueTime: '21:00',
        startDate: new Date(),
      },
    });

    await prisma.taskInstance.upsert({
      where: {
        taskId_taskDate: {
          taskId: readingTask.id,
          taskDate: todayStr,
        },
      },
      create: {
        taskId: readingTask.id,
        userId: user.id,
        goalId: null,
        title: readingTask.title,
        description: readingTask.description,
        category: readingTask.category,
        priority: readingTask.priority,
        taskDate: todayStr,
        dueTime: '21:00',
        completed: false,
      },
      update: {},
    });
    console.log('[Seed] Created Reading Task');
  }

  // Recalculate goal progress
  const totalFitness = await prisma.taskInstance.count({ where: { goalId: fitnessGoal.id } });
  const compFitness = await prisma.taskInstance.count({ where: { goalId: fitnessGoal.id, completed: true } });
  await prisma.goal.update({
    where: { id: fitnessGoal.id },
    data: { progress: totalFitness > 0 ? Math.round((compFitness / totalFitness) * 100) : 0 },
  });

  const totalLearning = await prisma.taskInstance.count({ where: { goalId: learningGoal.id } });
  const compLearning = await prisma.taskInstance.count({ where: { goalId: learningGoal.id, completed: true } });
  await prisma.goal.update({
    where: { id: learningGoal.id },
    data: { progress: totalLearning > 0 ? Math.round((compLearning / totalLearning) * 100) : 0 },
  });

  // Seed Character RPG progression
  let character = await prisma.character.findUnique({ where: { userId: user.id } });
  if (!character) {
    character = await prisma.character.create({
      data: {
        userId: user.id,
        level: 3,
        totalXP: 320,
        currentStreak: 4,
        longestStreak: 7,
        stage: 'Developing',
        lastActiveDate: todayStr,
      },
    });

    await prisma.characterStat.create({
      data: {
        characterId: character.id,
        strength: 22,
        knowledge: 28,
        focus: 20,
        discipline: 25,
        consistency: 20,
      },
    });
    console.log('[Seed] Seeded Character RPG stats and Level 3 progression');
  }

  // Seed XP Transaction Ledger
  const xpCount = await prisma.xPTransaction.count({ where: { userId: user.id } });
  if (xpCount === 0) {
    await prisma.xPTransaction.createMany({
      data: [
        {
          userId: user.id,
          amount: 45,
          reason: XPReason.TASK_COMPLETED,
          description: 'Completed Hydration Quest (+45 XP)',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          amount: 50,
          reason: XPReason.TASK_COMPLETED,
          description: 'Completed TypeScript Study (+50 XP)',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          amount: 25,
          reason: XPReason.DAILY_BONUS,
          description: 'All Daily Tasks Completed Bonus (+25 XP)',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          userId: user.id,
          amount: 50,
          reason: XPReason.TASK_COMPLETED,
          description: 'Completed Gym Workout (+50 XP)',
          createdAt: new Date(),
        },
      ],
    });
    console.log('[Seed] Seeded XP Transactions');
  }

  // Ensure default achievements exist
  const firstStepAch = await prisma.achievement.upsert({
    where: { key: 'FIRST_STEP' },
    update: {},
    create: {
      key: 'FIRST_STEP',
      title: 'First Step',
      description: 'Complete your first quest task.',
      icon: 'trophy',
      category: 'TASKS',
      requirementType: 'TASKS_COMPLETED',
      requirementValue: 1,
      xpReward: 50,
    },
  });

  const gettingStartedAch = await prisma.achievement.upsert({
    where: { key: 'GETTING_STARTED' },
    update: {},
    create: {
      key: 'GETTING_STARTED',
      title: 'Getting Started',
      description: 'Complete 5 quest tasks.',
      icon: 'sparkles',
      category: 'TASKS',
      requirementType: 'TASKS_COMPLETED',
      requirementValue: 5,
      xpReward: 100,
    },
  });

  // Award first achievement to demo user
  await prisma.userAchievement.upsert({
    where: {
      userId_achievementId: {
        userId: user.id,
        achievementId: firstStepAch.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      achievementId: firstStepAch.id,
    },
  });

  console.log('[Seed] Complete LifeQuest RPG Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
