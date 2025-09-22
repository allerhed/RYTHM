import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../../apps/api/src/router';

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc', // Use relative URL to go through mobile app proxy
        headers() {
          // Get token from localStorage for authentication
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
          return {
            ...(token && { Authorization: `Bearer ${token}` }),
          };
        },
      }),
    ],
  });
}