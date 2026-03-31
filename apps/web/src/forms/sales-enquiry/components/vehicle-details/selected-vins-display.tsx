"use client";

import { VinDetailsCard } from "../vin-details-card";

interface SelectedVinsDisplayProps {
  selectedVinsWithQuantity: Map<string, { vin: any; quantity: number; vinValue: string }>;
  onRemove: (selectionKey: string) => void;
  onQuantityChange: (selectionKey: string, quantity: number) => void;
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
  onQuantityChange,
}: SelectedVinsDisplayProps) {
  if (selectedVinsWithQuantity.size === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {Array.from(selectedVinsWithQuantity.entries()).map(([selectionKey, { vin, vinValue, quantity }]) => (
        <VinDetailsCard
          key={selectionKey}
          vin={vin}
          vinValue={(vin as any)?.VIN || (vin as any)?.VINNUMBER || (vin as any)?.U_Veh_StockID || vinValue}
          quantity={quantity}
          onQuantityChange={(nextQuantity) => onQuantityChange(selectionKey, nextQuantity)}
          onRemove={() => onRemove(selectionKey)}
        />
      ))}
    </div>
  );
}
