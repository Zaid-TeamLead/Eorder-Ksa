/**
 * Enquiries Hook
 *
 * Fetches all sales enquiries with proper typing.
 *
 * @example
 * ```tsx
 * const { enquiries, isLoading, error, refetch } = useEnquiries();
 * ```
 */

import { queryKeys } from "@/lib/query-keys";
import { getAllEnquiries, type EnquiryFilters } from "@/services/enquiry";
import type { UseEnquiriesReturn } from "@/types/enquiry";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export function useEnquiries(filters?: EnquiryFilters): UseEnquiriesReturn {
  const { data: enquiries, isLoading, error, refetch } = useEntityQuery({
    queryKey: filters ? queryKeys.enquiries.list(filters) : queryKeys.enquiries.all,
    queryFn: () => getAllEnquiries(filters),
    defaultValue: [],
  });

  return { enquiries, isLoading, error, refetch };
}
