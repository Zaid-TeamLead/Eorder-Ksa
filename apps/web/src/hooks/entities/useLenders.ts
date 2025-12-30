/**
 * Lenders Hook
 *
 * Fetches the list of available lenders/banks.
 *
 * @example
 * ```tsx
 * const { lenders, isLoading, error } = useLenders();
 * ```
 */

import { queryKeys } from "@/lib/query-keys";
import { getLenders } from "@/services/financing";
import type { UseLendersReturn } from "@/types/financing";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export function useLenders(): UseLendersReturn {
  const { data: lenders, isLoading, error } = useEntityQuery({
    queryKey: queryKeys.lenders.all,
    queryFn: getLenders,
    defaultValue: [],
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (lenders don't change often)
  });

  return { lenders, isLoading, error };
}
