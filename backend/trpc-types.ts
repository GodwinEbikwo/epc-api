import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AnyRouter } from '@trpc/server';

// 👇 This matches the `appRouter` you export in trpc.js
declare const appRouter: AnyRouter;

export type AppRouter = typeof appRouter;
export type RouterInputs = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;