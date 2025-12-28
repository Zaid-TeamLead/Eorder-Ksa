/**
 * Discount Approvals Hook
 *
 * Fetches discount approval requests with optional filters.
 *
 * @example
 * ```tsx
 * const { approvals, isLoading, error, refetch } = useDiscountApprovals();
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getAllDiscountApprovals,
  getPendingDiscountApprovals,
} from "@/services/quotation";
import type {
  DiscountApprovalFilters,
  UseDiscountApprovalsReturn,
} from "@/types/quotation";

/**
 * Fetch all discount approval requests with optional filters
 */
export function useDiscountApprovals(
  filters?: DiscountApprovalFilters
): UseDiscountApprovalsReturn {
  const {
    data: approvals,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.discountApprovals.all,
    queryFn: () => getAllDiscountApprovals(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes - approvals don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });

  return {
    approvals: approvals || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Fetch pending discount approvals assigned to the current user
 */
export function usePendingDiscountApprovals(): UseDiscountApprovalsReturn {
  const {
    data: approvals,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.discountApprovals.pending,
    queryFn: getPendingDiscountApprovals,
    staleTime: 5 * 60 * 1000, // 5 minutes - approvals don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
  });

  return {
    approvals: approvals || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
