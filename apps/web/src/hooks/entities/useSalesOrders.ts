import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getAllSalesOrders, getSalesOrderById } from '@/services/salesOrder';
import type { SalesOrderFilters } from '@/types/salesOrder';

export function useSalesOrders(filters?: SalesOrderFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.salesOrders.all,
    queryFn: () => getAllSalesOrders(filters),
  });

  return {
    salesOrders: data || [],
    isLoading,
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
