/**
 * Test Drives Hook
 *
 * Fetches all test drive bookings with proper typing.
 *
 * @example
 * ```tsx
 * const { bookings, isLoading, error, refetch } = useTestDrives();
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getAllBookTestDrives } from "@/services/bookTestDrive";

export function useTestDrives() {
  const {
    data: bookings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.testDrive.all,
    queryFn: getAllBookTestDrives,
  });

  return {
    bookings: bookings || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
