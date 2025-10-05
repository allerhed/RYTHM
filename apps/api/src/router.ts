import { router } from './trpc';
import { authRouter } from './routes/auth';
import { sessionsRouter } from './routes/sessions';
import { setsRouter } from './routes/sets';
import { analyticsRouter } from './routes/analytics';
import { usersRouter } from './routes/users';
import { adminRouter } from './routes/admin';
import { exerciseTemplatesRouter } from './routes/exerciseTemplates';
import { workoutTemplatesRouter } from './routes/workoutTemplates';
import { equipmentRouter } from './routes/equipment';
import { personalRecordsRouter } from './routes/personalRecords';

export const appRouter = router({
  authentication: authRouter,
  workoutSessions: sessionsRouter,
  workoutSets: setsRouter,
  statistics: analyticsRouter,
  userProfiles: usersRouter,
  users: usersRouter, // Add users mapping for admin UI compatibility
  admin: adminRouter,
  exerciseTemplates: exerciseTemplatesRouter,
  workoutTemplates: workoutTemplatesRouter,
  gymEquipment: equipmentRouter,
  equipment: equipmentRouter, // Add equipment mapping for mobile UI compatibility
  personalRecords: personalRecordsRouter,
});

export type AppRouter = typeof appRouter;