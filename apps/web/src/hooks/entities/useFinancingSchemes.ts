/**
 * Financing Schemes Hook
 *
 * Fetches financing schemes for a specific enquiry.
 *
 * @example
 * ```tsx
 * const { schemes, isLoading, error, refetch } = useFinancingSchemes(enquiryId);
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getFinancingByEnquiryId } from "@/services/financing";
import type { UseFinancingSchemesReturn } from "@/types/financing";

export function useFinancingSchemes(
  enquiryId: number
): UseFinancingSchemesReturn {
  const {
    data: schemes,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.financing.schemes(enquiryId),
    queryFn: () => getFinancingByEnquiryId(enquiryId),
    enabled: !!enquiryId && !isNaN(enquiryId),
  });

  return {
    schemes: schemes || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
