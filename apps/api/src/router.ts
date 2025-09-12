import { router } from './trpc';
import { authRouter } from './routes/auth';
import { sessionsRouter } from './routes/sessions';
import { setsRouter } from './routes/sets';
import { analyticsRouter } from './routes/analytics';
import { usersRouter } from './routes/users';

export const appRouter = router({
  auth: authRouter,
  sessions: sessionsRouter,
  sets: setsRouter,
  analytics: analyticsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;