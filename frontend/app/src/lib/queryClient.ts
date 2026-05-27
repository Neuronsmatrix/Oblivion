import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // Don't retry auth/permission errors.
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

/** Statuses that mean "keep polling". */
export const isInFlight = (status: string) => status === 'pending' || status === 'processing';
