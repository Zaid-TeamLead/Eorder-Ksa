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

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getAllEnquiries } from "@/services/enquiry";
import type { UseEnquiriesReturn } from "@/types/enquiry";

export function useEnquiries(): UseEnquiriesReturn {
  const {
    data: enquiries,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.enquiries.all,
    queryFn: getAllEnquiries,
  });

  return {
    enquiries: enquiries || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
