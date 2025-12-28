import { useCallback, useEffect } from 'react';
import type { VehicleInventory } from '@/services/vehicles';

interface UseVehicleSelectionReturn {
  handleVehicleSelect: (vehicle: VehicleInventory) => void;
  listenForSelection: (callback: (vehicle: VehicleInventory) => void) => () => void;
}

/**
 * Custom hook for vehicle selection via modal
 *
 * Provides a mechanism to pass vehicle data from a selection modal to a form
 * using sessionStorage and custom events. This pattern allows decoupling of
 * the modal component from the form component.
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
export function useVehicleSelection(): UseVehicleSelectionReturn {
  /**
   * Handle vehicle selection from modal
   * Stores the selected vehicle in sessionStorage and dispatches a custom event
   * @param vehicle - The selected vehicle inventory item
   */
  const handleVehicleSelect = useCallback((vehicle: VehicleInventory) => {
    sessionStorage.setItem('selectedEnquiryVehicle', JSON.stringify(vehicle));
    window.dispatchEvent(new CustomEvent('vehicleSelected', { detail: vehicle }));
  }, []);

  /**
   * Listen for vehicle selection events
   * Sets up an event listener for the 'vehicleSelected' custom event
   * @param callback - Function to call when a vehicle is selected
   * @returns Cleanup function to remove the event listener
   */
  const listenForSelection = useCallback(
    (callback: (vehicle: VehicleInventory) => void) => {
      const handleSelection = (event: Event) => {
        const customEvent = event as CustomEvent<VehicleInventory>;
        if (customEvent.detail) {
          callback(customEvent.detail);
          // Clean up sessionStorage after using the data
          sessionStorage.removeItem('selectedEnquiryVehicle');
        }
      };

      window.addEventListener('vehicleSelected', handleSelection);

      // Also check sessionStorage on mount in case event was missed
      const storedVehicle = sessionStorage.getItem('selectedEnquiryVehicle');
      if (storedVehicle) {
        try {
          const vehicle = JSON.parse(storedVehicle) as VehicleInventory;
          callback(vehicle);
          sessionStorage.removeItem('selectedEnquiryVehicle');
        } catch (error) {
          console.error('Error parsing stored vehicle:', error);
          sessionStorage.removeItem('selectedEnquiryVehicle');
        }
      }

      // Return cleanup function
      return () => {
        window.removeEventListener('vehicleSelected', handleSelection);
      };
    },
    []
  );

  return {
    handleVehicleSelect,
    listenForSelection,
  };
}
