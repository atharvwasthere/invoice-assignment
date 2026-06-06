import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient for the app. `staleTime` of 30s avoids refetching list/summary
 * data on every focus while still keeping it reasonably fresh; one retry on failure.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
