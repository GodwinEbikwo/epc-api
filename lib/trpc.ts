import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/backend/trpc-types';

export const trpc = createTRPCReact<AppRouter>();