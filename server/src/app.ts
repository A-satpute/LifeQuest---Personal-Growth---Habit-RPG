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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === env.CLIENT_URL ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Root greeting endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'LifeQuest Backend API',
    status: 'online',
    version: '1.0.0',
    health: '/api/health',
  });
});

// Request logger in dev
if (env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get(['/api/health', '/health'], async (_req: Request, res: Response) => {
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

// Mount Routes (support both /api/* and /* for seamless client integration)
const routePairs: Array<[string, express.Router]> = [
  ['/auth', authRoutes],
  ['/users', userRoutes],
  ['/goals', goalRoutes],
  ['/tasks', taskRoutes],
  ['/gamification', gamificationRoutes],
  ['/character', gamificationRoutes],
  ['/notifications', notificationRoutes],
  ['/ai', aiRoutes],
  ['/analytics', analyticsRoutes],
  ['/achievements', achievementRoutes],
];

for (const [prefix, router] of routePairs) {
  app.use(`/api${prefix}`, router);
  app.use(prefix, router);
}

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
