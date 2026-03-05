import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

interface UseEntityQueryOptions<T> {
  /** React Query key for this query */
  queryKey: readonly unknown[];
  /** Function to fetch the data */
  queryFn: () => Promise<T>;
  /** Default value to return when data is undefined. Default: [] */
  defaultValue?: T;
  /** Whether the query is enabled. Default: true */
  enabled?: boolean;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Cache time in milliseconds */
  gcTime?: number;
}

interface UseEntityQueryReturn<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for entity data fetching with React Query
 *
 * Eliminates duplicate code across entity hooks by providing
 * a standard pattern for data fetching, loading, and error states.
 *
 * @example
 * ```typescript
 * const { data: enquiries, isLoading, error, refetch } = useEntityQuery({
 *   queryKey: queryKeys.enquiries.all,
 *   queryFn: getAllEnquiries,
 *   defaultValue: [],
 * });
 * ```
 */
export function useEntityQuery<T>({
  queryKey,
  queryFn,
  defaultValue,
  enabled = true,
  staleTime,
  gcTime,
}: UseEntityQueryOptions<T>): UseEntityQueryReturn<T> {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime,
  } as UseQueryOptions<T>);

  return {
    data: data ?? (defaultValue as T),
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
