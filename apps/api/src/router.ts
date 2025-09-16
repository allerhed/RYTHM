import { router } from './trpc';
import { authRouter } from './routes/auth';
import { sessionsRouter } from './routes/sessions';
import { setsRouter } from './routes/sets';
import { analyticsRouter } from './routes/analytics';
import { usersRouter } from './routes/users';
import { adminRouter } from './routes/admin';
import { exerciseTemplatesRouter } from './routes/exerciseTemplates';
import { workoutTemplatesRouter } from './routes/workoutTemplates';

export const appRouter = router({
  auth: authRouter,
  sessions: sessionsRouter,
  sets: setsRouter,
  analytics: analyticsRouter,
  users: usersRouter,
  admin: adminRouter,
  exerciseTemplates: exerciseTemplatesRouter,
  workoutTemplates: workoutTemplatesRouter,
});

export type AppRouter = typeof appRouter;