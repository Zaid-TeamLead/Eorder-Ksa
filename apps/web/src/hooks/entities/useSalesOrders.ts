import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getAllSalesOrders, getSalesOrderById } from '@/services/salesOrder';
import type { SalesOrderFilters } from '@/types/salesOrder';

interface UseSalesOrdersOptions {
  enabled?: boolean;
}

export function useSalesOrders(
  filters?: SalesOrderFilters,
  options: UseSalesOrdersOptions = {}
) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.salesOrders.list(filters),
    queryFn: () => getAllSalesOrders(filters),
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });

  return {
    salesOrders: data || [],
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

export function useSalesOrderById(id: number) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.salesOrders.detail(id),
    queryFn: () => getSalesOrderById(id),
    enabled: !!id && id > 0,
  });

  return {
    salesOrder: data || null,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
