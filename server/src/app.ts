import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { prisma } from './db/prisma';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import goalRoutes from './routes/goal.routes';
import taskRoutes from './routes/task.routes';
import gamificationRoutes from './routes/gamification.routes';
import notificationRoutes from './routes/notification.routes';
import aiRoutes from './routes/ai.routes';
import analyticsRoutes from './routes/analytics.routes';
import achievementRoutes from './routes/achievement.routes';
import { NotificationScheduler } from './services/scheduler.service';
import { errorHandler, AppError } from './middlewares/errorHandler';

const app = express();

// Middlewares
app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());

// Request logger in dev
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      database: 'connected (PostgreSQL)',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/character', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/achievements', achievementRoutes);

// 404 Handler
app.use((req: Request, res: Response, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
});

// Centralized Error Handler
app.use(errorHandler);

// Start server only when executed directly
if (require.main === module) {
  app.listen(env.PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 LifeQuest Server is running on port ${env.PORT}`);
    console.log(`📡 Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`🛡️  Environment: ${env.NODE_ENV}`);
    console.log(`===============================================`);

    // Start background notification scheduler
    NotificationScheduler.start(60 * 1000);
  });
}

export default app;
