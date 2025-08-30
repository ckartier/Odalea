import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import usersCheckAvailability from "./routes/users/checkAvailability/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  users: createTRPCRouter({
    checkAvailability: usersCheckAvailability,
  }),
});

export type AppRouter = typeof appRouter;