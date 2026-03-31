import { useCallback } from "react";
import type { VehicleChargeItem } from "@/services/vehicles";

interface UseChargeSelectionReturn {
  handleChargeSelect: (charge: VehicleChargeItem) => void;
  listenForSelection: (callback: (charge: VehicleChargeItem) => void) => () => void;
}

const chargeSelectionCallbacks = new Set<(charge: VehicleChargeItem) => void>();

export function useChargeSelection(): UseChargeSelectionReturn {
  const handleChargeSelect = useCallback((charge: VehicleChargeItem) => {
    chargeSelectionCallbacks.forEach((callback) => {
      callback(charge);
    });
  }, []);

  const listenForSelection = useCallback((callback: (charge: VehicleChargeItem) => void) => {
    chargeSelectionCallbacks.add(callback);
    return () => {
      chargeSelectionCallbacks.delete(callback);
    };
  }, []);

  return {
    handleChargeSelect,
    listenForSelection,
  };
}

