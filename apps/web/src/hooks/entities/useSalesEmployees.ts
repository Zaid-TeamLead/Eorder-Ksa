import { queryKeys } from "@/lib/query-keys";
import { getSalesEmployees } from "@/services/financing";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";
import type { SalesEmployee } from "@/services/financing";

interface UseSalesEmployeesReturn {
  salesEmployees: SalesEmployee[];
  isLoading: boolean;
  error: Error | null;
}

export function useSalesEmployees(): UseSalesEmployeesReturn {
  const { data: salesEmployees, isLoading, error } = useEntityQuery({
    queryKey: queryKeys.salesEmployees.all,
    queryFn: () => getSalesEmployees(),
    defaultValue: [],
    staleTime: 10 * 60 * 1000,
  });

  return { salesEmployees, isLoading, error };
}
