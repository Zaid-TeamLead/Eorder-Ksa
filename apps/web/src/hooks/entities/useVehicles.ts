/**
 * Vehicles Hook
 *
 * Fetches all vehicle inventory with proper typing.
 *
 * @example
 * ```tsx
 * const { vehicles, isLoading, error, refetch } = useVehicles();
 * ```
 */

import { queryKeys } from "@/lib/query-keys";
import { getAllVehicleInventory, type VehicleInventory } from "@/services/vehicles";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export interface UseVehiclesReturn {
  vehicles: VehicleInventory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVehicles(customerCode?: string, enabled = true): UseVehiclesReturn {
  const normalizedCustomerCode = (customerCode || "").trim();
  const { data: vehicles, isLoading, error, refetch } = useEntityQuery({
    queryKey: normalizedCustomerCode
      ? queryKeys.vehicles.byCustomer(normalizedCustomerCode)
      : queryKeys.vehicles.all,
    queryFn: () => getAllVehicleInventory(normalizedCustomerCode || undefined),
    defaultValue: [],
    enabled,
  });

  return { vehicles, isLoading, error, refetch };
}
