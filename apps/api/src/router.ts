import { router } from './trpc';
import { authRouter } from './routes/auth';
import { sessionsRouter } from './routes/sessions';
import { setsRouter } from './routes/sets';
import { analyticsRouter } from './routes/analytics';

export const appRouter = router({
  auth: authRouter,
  sessions: sessionsRouter,
  sets: setsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;