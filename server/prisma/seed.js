"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('[Seed] Seeding database for Phase 2...');
    const demoEmail = 'hero@lifequest.com';
    let user = await prisma.user.findUnique({
        where: { email: demoEmail },
    });
    const passwordHash = await bcryptjs_1.default.hash('HeroPassword123!', 12);
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
    }
    else {
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
                priority: client_1.Priority.HIGH,
                status: client_1.GoalStatus.ACTIVE,
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
                priority: client_1.Priority.HIGH,
                status: client_1.GoalStatus.ACTIVE,
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
                priority: client_1.Priority.MEDIUM,
                isRecurring: true,
                recurrenceType: client_1.RecurrenceType.DAILY,
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
                priority: client_1.Priority.HIGH,
                isRecurring: true,
                recurrenceType: client_1.RecurrenceType.WEEKLY,
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
                priority: client_1.Priority.HIGH,
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
                priority: client_1.Priority.MEDIUM,
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
        data: { progress: totalFitness > 0 ? (compFitness / totalFitness) * 100 : 0 },
    });
    const totalLearning = await prisma.taskInstance.count({ where: { goalId: learningGoal.id } });
    const compLearning = await prisma.taskInstance.count({ where: { goalId: learningGoal.id, completed: true } });
    await prisma.goal.update({
        where: { id: learningGoal.id },
        data: { progress: totalLearning > 0 ? (compLearning / totalLearning) * 100 : 0 },
    });
    console.log('[Seed] Phase 2 Seed Complete!');
}
main()
    .catch((e) => {
    console.error('[Seed Error]', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
