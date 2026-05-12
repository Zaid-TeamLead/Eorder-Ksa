/**
 * Quotations Hook
 *
 * Fetches all quotations with optional filters.
 *
 * @example
 * ```tsx
 * const { quotations, isLoading, error, refetch } = useQuotations();
 * ```
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getAllQuotations,
  getQuotationById,
  getQuotationsByEnquiryId,
  getQuotationActivities,
  getOpenDeposits,
} from "@/services/quotation";
import type { QuotationFilters } from "@/types/quotation";
import type {
  UseQuotationsReturn,
  UseQuotationByIdReturn,
  UseQuotationsByEnquiryReturn,
} from "@/types/quotation";

/**
 * Fetch all quotations with optional filters
 */
export function useQuotations(filters?: QuotationFilters): UseQuotationsReturn {
  const {
    data: quotations,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: filters ? queryKeys.quotations.list(filters) : queryKeys.quotations.all,
    queryFn: () => getAllQuotations(filters),
    placeholderData: keepPreviousData,
  });

  return {
    quotations: quotations || [],
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Fetch a single quotation by ID with line items
 */
export function useQuotationById(id: number): UseQuotationByIdReturn {
  const {
    data: quotation,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.quotations.detail(id),
    queryFn: () => getQuotationById(id),
    enabled: !!id && id > 0,
  });

  return {
    quotation: quotation || null,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Fetch all quotations for a specific enquiry
 */
export function useQuotationsByEnquiry(enquiryId: number): UseQuotationsByEnquiryReturn {
  const {
    data: quotations,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.quotations.byEnquiry(enquiryId),
    queryFn: () => getQuotationsByEnquiryId(enquiryId),
    enabled: !!enquiryId && enquiryId > 0,
  });

  return {
    quotations: quotations || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Fetch all activities for a quotation
 */
export function useQuotationActivities(quotationId: number) {
  const {
    data: activities,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.quotations.activities(quotationId),
    queryFn: () => getQuotationActivities(quotationId),
    enabled: !!quotationId && quotationId > 0,
  });

  return {
    activities: activities || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

/**
 * Fetch quotations with open deposits (passed to cashier, not yet allocated)
 */
export function useOpenDeposits() {
  const {
    data: deposits,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.quotations.openDeposits,
    queryFn: getOpenDeposits,
  });

  return {
    deposits: deposits || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
