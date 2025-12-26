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

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getLenders } from "@/services/financing";
import { toast } from "sonner";
import type { UseLendersReturn } from "@/types/financing";

export function useLenders(): UseLendersReturn {
  const {
    data: lenders,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.lenders.all,
    queryFn: getLenders,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (lenders don't change often)
    onError: () => {
      toast.error("Failed to load lenders");
    },
  });

  return {
    lenders: lenders || [],
    isLoading,
    error: error as Error | null,
  };
}
