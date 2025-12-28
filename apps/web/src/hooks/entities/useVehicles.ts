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

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getAllVehicleInventory, type VehicleInventory } from "@/services/vehicles";

export interface UseVehiclesReturn {
  vehicles: VehicleInventory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useVehicles(): UseVehiclesReturn {
  const {
    data: vehicles,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.vehicles.all,
    queryFn: getAllVehicleInventory,
  });

  return {
    vehicles: vehicles || [],
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}
