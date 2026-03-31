import { useQuery } from "@tanstack/react-query";
import { getCurrencies } from "@/services/financing";
import { queryKeys } from "@/lib/query-keys";
import type { Currency } from "@/services/financing";

export function useCurrencies() {
  const { data = [], isLoading, error } = useQuery<Currency[]>({
    queryKey: queryKeys.currencies.all,
    queryFn: () => getCurrencies(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    currencies: data,
    isLoading,
    error: error as Error | null,
  };
}
