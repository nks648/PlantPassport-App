import { createTRPCRouter } from "./create-context";
import { plantIdentifyRouter } from "./routes/plant-identify";

export const appRouter = createTRPCRouter({
  plantIdentify: plantIdentifyRouter,
});

export type AppRouter = typeof appRouter;
