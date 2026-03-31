import { queryKeys } from "@/lib/query-keys";
import { getVehicleChargeItems, type VehicleChargeItem } from "@/services/vehicles";
import { useEntityQuery } from "@/hooks/shared/useEntityQuery";

export interface UseChargeItemsReturn {
  chargeItems: VehicleChargeItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useChargeItems(
  _customerCode?: string,
  enabled = true
): UseChargeItemsReturn {
  const { data: chargeItems, isLoading, error, refetch } = useEntityQuery({
    queryKey: queryKeys.vehicles.chargesByCustomer("ALL"),
    queryFn: () =>
      getVehicleChargeItems({
        itemGroup: "CHARGE",
      }),
    defaultValue: [],
    enabled,
  });

  return {
    chargeItems,
    isLoading,
    error,
    refetch,
  };
}
