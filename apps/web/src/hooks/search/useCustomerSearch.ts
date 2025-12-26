/**
 * Customer Search Hook
 *
 * Provides debounced customer search functionality with caching.
 * Used in Sales Enquiry and Test Drive modules.
 *
 * Benefits:
 * - Automatic debouncing (prevents excessive API calls)
 * - Query caching with React Query
 * - Consistent search UX across modules
 * - Type-safe customer data
 *
 * @example
 * ```tsx
 * const { search, results, isSearching, clear } = useCustomerSearch();
 *
 * // In search input handler
 * const handleSearch = async (query: string) => {
 *   await search(query);
 * };
 *
 * // Results are automatically updated
 * {results.map(customer => ...)}
 * ```
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { useSession } from "@/lib/auth-client";
import { queryKeys } from "@/lib/query-keys";
import axios from "axios";
import type { Customer, UseCustomerSearchReturn } from "@/types/customer";

export function useCustomerSearch(): UseCustomerSearchReturn {
  const { data: session } = useSession();
  const slpCode = session?.user.SlpCode;

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300); // 300ms debounce

  const {
    data,
    isLoading: isSearching,
    error,
  } = useQuery({
    queryKey: queryKeys.customers.search(debouncedQuery),
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      const response = await axios.post<{ success: boolean; data: Customer[] }>(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/customers/search`,
        {
          search: debouncedQuery,
          slpCode: slpCode?.toString() || "",
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return response.data.data || [];
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const search = async (query: string) => {
    setSearchQuery(query);
  };

  const clear = () => {
    setSearchQuery("");
  };

  return {
    search,
    results: data || [],
    isSearching,
    error: error as Error | null,
    clear,
  };
}
