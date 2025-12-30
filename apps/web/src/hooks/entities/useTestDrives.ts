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

import { queryKeys } from "@/lib/query-keys";
import { getAllBookTestDrives } from "@/services/bookTestDrive";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export function useTestDrives() {
  const { data: bookings, isLoading, error, refetch } = useEntityQuery({
    queryKey: queryKeys.testDrive.all,
    queryFn: getAllBookTestDrives,
    defaultValue: [],
  });

  return { bookings, isLoading, error, refetch };
}
