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

export function useVehicles(): UseVehiclesReturn {
  const { data: vehicles, isLoading, error, refetch } = useEntityQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: getAllVehicleInventory,
    defaultValue: [],
  });

  return { vehicles, isLoading, error, refetch };
}
