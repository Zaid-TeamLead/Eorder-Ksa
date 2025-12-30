"use client";

import { VinDetailsCard } from "../vin-details-card";

interface SelectedVinsDisplayProps {
  selectedVinsWithQuantity: Map<string, { vin: any; quantity: number }>;
  onRemove: (vinValue: string) => void;
}

/**
 * Displays selected VIN numbers with their details
 *
 * Renders a list of VinDetailsCard components for each selected VIN,
 * allowing users to view details and remove selections.
 */
export function SelectedVinsDisplay({
  selectedVinsWithQuantity,
  onRemove,
}: SelectedVinsDisplayProps) {
  if (selectedVinsWithQuantity.size === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {Array.from(selectedVinsWithQuantity.entries()).map(([vinValue, { vin, quantity }]) => (
        <VinDetailsCard
          key={vinValue}
          vin={vin}
          vinValue={vinValue}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
