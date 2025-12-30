import { useCallback, useEffect, useRef } from 'react';
import type { VehicleInventory } from '@/services/vehicles';

interface UseVehicleSelectionReturn {
  handleVehicleSelect: (vehicle: VehicleInventory) => void;
  listenForSelection: (callback: (vehicle: VehicleInventory) => void) => () => void;
}

/**
 * Custom hook for vehicle selection via modal
 *
 * Provides a mechanism to pass vehicle data from a selection modal to a form.
 * Uses a callback ref pattern for type-safe component communication.
 *
 * This is a transitional implementation that maintains backward compatibility
 * while moving away from window events to a more React-idiomatic pattern.
 *
 * @example
 * ```tsx
 * // In the parent component with the modal:
 * const { handleVehicleSelect } = useVehicleSelection();
 *
 * <VehicleSelectionModal
 *   onSelectVehicle={(vehicle) => {
 *     handleVehicleSelect(vehicle);
 *     setModalOpen(false);
 *   }}
 * />
 *
 * // In the form component:
 * const { listenForSelection } = useVehicleSelection();
 *
 * useEffect(() => {
 *   return listenForSelection((vehicle) => {
 *     form.setValue('make', vehicle.MAKE);
 *     form.setValue('model', vehicle.MODEL);
 *     // ... populate other fields
 *   });
 * }, []);
 * ```
 */

// Module-level callback registry for cross-component communication
const vehicleSelectionCallbacks = new Set<(vehicle: VehicleInventory) => void>();

export function useVehicleSelection(): UseVehicleSelectionReturn {
  /**
   * Handle vehicle selection from modal
   * Notifies all registered listeners about the selected vehicle
   * @param vehicle - The selected vehicle inventory item
   */
  const handleVehicleSelect = useCallback((vehicle: VehicleInventory) => {
    vehicleSelectionCallbacks.forEach((callback) => {
      callback(vehicle);
    });
  }, []);

  /**
   * Listen for vehicle selection events
   * Registers a callback to be called when a vehicle is selected
   * @param callback - Function to call when a vehicle is selected
   * @returns Cleanup function to unregister the callback
   */
  const listenForSelection = useCallback(
    (callback: (vehicle: VehicleInventory) => void) => {
      vehicleSelectionCallbacks.add(callback);

      // Return cleanup function
      return () => {
        vehicleSelectionCallbacks.delete(callback);
      };
    },
    []
  );

  return {
    handleVehicleSelect,
    listenForSelection,
  };
}
