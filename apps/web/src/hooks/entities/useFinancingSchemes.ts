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

import { queryKeys } from "@/lib/query-keys";
import { getFinancingByEnquiryId } from "@/services/financing";
import type { UseFinancingSchemesReturn } from "@/types/financing";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export function useFinancingSchemes(
  enquiryId: number
): UseFinancingSchemesReturn {
  const { data: schemes, isLoading, error, refetch } = useEntityQuery({
    queryKey: queryKeys.financing.schemes(enquiryId),
    queryFn: () => getFinancingByEnquiryId(enquiryId),
    defaultValue: [],
    enabled: !!enquiryId && !isNaN(enquiryId),
  });

  return { schemes, isLoading, error, refetch };
}
