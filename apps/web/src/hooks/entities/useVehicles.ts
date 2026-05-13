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
import {
  getAllVehicleInventory,
  type VehicleInventory,
  type VehicleInventoryOptions,
} from "@/services/vehicles";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export interface UseVehiclesReturn {
  vehicles: VehicleInventory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseVehiclesOptions extends VehicleInventoryOptions {
  enabled?: boolean;
}

export function useVehicles(
  customerCode?: string,
  enabledOrOptions: boolean | UseVehiclesOptions = true
): UseVehiclesReturn {
  const normalizedCustomerCode = (customerCode || "").trim();
  const options =
    typeof enabledOrOptions === "boolean"
      ? { enabled: enabledOrOptions }
      : enabledOrOptions;
  const includeReservations = options.includeReservations ?? true;
  const { data: vehicles, isLoading, error, refetch } = useEntityQuery({
    queryKey: [
      ...(normalizedCustomerCode
        ? queryKeys.vehicles.byCustomer(normalizedCustomerCode)
        : queryKeys.vehicles.all),
      { includeReservations },
    ],
    queryFn: () =>
      getAllVehicleInventory(normalizedCustomerCode || undefined, { includeReservations }),
    defaultValue: [],
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return { vehicles, isLoading, error, refetch };
}
