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
import { getAllEnquiries } from "@/services/enquiry";
import type { UseEnquiriesReturn } from "@/types/enquiry";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export function useEnquiries(): UseEnquiriesReturn {
  const { data: enquiries, isLoading, error, refetch } = useEntityQuery({
    queryKey: queryKeys.enquiries.all,
    queryFn: getAllEnquiries,
    defaultValue: [],
  });

  return { enquiries, isLoading, error, refetch };
}
