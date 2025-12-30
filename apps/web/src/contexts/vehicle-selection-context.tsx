"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Vehicle Selection Context
 *
 * Provides type-safe communication for vehicle selection events
 * across components, replacing the previous window.dispatchEvent pattern.
 */

interface Vehicle {
  [key: string]: any;
}

interface VehicleSelectionContextType {
  /**
   * Callback when a vehicle is selected from the inventory modal
   */
  onVehicleSelected: (vehicle: Vehicle) => void;

  /**
   * Function to trigger opening the vehicle inventory modal
   */
  openVehicleInventoryModal: () => void;
}

const VehicleSelectionContext = createContext<VehicleSelectionContextType | null>(null);

interface VehicleSelectionProviderProps {
  children: ReactNode;
  value: VehicleSelectionContextType;
}

/**
 * Provider component for vehicle selection context
 */
export function VehicleSelectionProvider({ children, value }: VehicleSelectionProviderProps) {
  return (
    <VehicleSelectionContext.Provider value={value}>
      {children}
    </VehicleSelectionContext.Provider>
  );
}

/**
 * Hook to access vehicle selection context
 *
 * @throws Error if used outside of VehicleSelectionProvider
 */
export function useVehicleSelection() {
  const context = useContext(VehicleSelectionContext);

  if (!context) {
    throw new Error(
      'useVehicleSelection must be used within a VehicleSelectionProvider'
    );
  }

  return context;
}
