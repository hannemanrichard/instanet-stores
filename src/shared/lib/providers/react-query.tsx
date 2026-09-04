"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
            gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection time
            refetchOnWindowFocus: false, // Prevent unnecessary refetches
            refetchOnReconnect: true, // Refetch when connection restored
            retry: (failureCount, error: any) => {
              const status = error?.status;
              // Don't retry on 4xx client errors
              if (typeof status === "number" && status >= 400 && status < 500) {
                return false;
              }
              // Retry up to 1 time for server/network errors (keep UI snappy)
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) =>
              Math.min(500 * 2 ** attemptIndex, 2000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
