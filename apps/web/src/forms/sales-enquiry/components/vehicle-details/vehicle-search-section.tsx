"use client";

import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { VehicleSearch } from "../vehicle-search";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingState } from "@/components/shared/loading-state";
import type { UseFormReturn } from "react-hook-form";
import type { SalesEnquiryFormData } from "../../schema";

interface VehicleSearchSectionProps {
  form: UseFormReturn<SalesEnquiryFormData>;
  vehicleSearch: string;
  onVehicleSearchChange: (value: string) => void;
  onSearch: (query: string) => Promise<{ success: boolean; data: any[] } | undefined>;
  onVehicleSelect: (vehicle: any) => void;
  onBrowseInventory: () => void;
  loadingVinNumbers: boolean;
  vinNumbersCount: number;
  selectedVinsCount: number;
  onOpenVinDialog: () => void;
  customerId: string;
  variant: string;
}

/**
 * Vehicle search section with inventory browsing
 *
 * Handles:
 * - Vehicle search by code/name/model
 * - Browse inventory button
 * - VIN number selection button
 */
export function VehicleSearchSection({
  form,
  vehicleSearch,
  onVehicleSearchChange,
  onSearch,
  onVehicleSelect,
  onBrowseInventory,
  loadingVinNumbers,
  vinNumbersCount,
  selectedVinsCount,
  onOpenVinDialog,
  customerId,
  variant,
}: VehicleSearchSectionProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <VehicleSearch
          value={vehicleSearch}
          onChange={onVehicleSearchChange}
          onSearch={onSearch}
          onVehicleSelect={onVehicleSelect}
        />
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBrowseInventory}
          className="h-8 text-sm"
        >
          <Package className="w-4 h-4 mr-2" />
          Browse Inventory
        </Button>
      </div>

      <div className="w-[280px]">
        <FormField
          control={form.control}
          name="vinNumber"
          render={({ field }) => {
            const selectedVinFromForm =
              typeof field.value === "string" ? field.value.trim() : "";

            return (
              <FormItem>
                <FormLabel className="text-xs font-medium">
                  VIN Number
                  {loadingVinNumbers && (
                    <LoadingState message="Loading..." />
                  )}
                </FormLabel>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-sm w-full justify-start"
                    onClick={onOpenVinDialog}
                    disabled={loadingVinNumbers || vinNumbersCount === 0 || !customerId || !variant}
                  >
                    {selectedVinsCount > 0
                      ? `${selectedVinsCount} VIN${selectedVinsCount > 1 ? "s" : ""} selected`
                      : selectedVinFromForm
                        ? `VIN: ${selectedVinFromForm}`
                        : !customerId || !variant
                          ? "Select customer & vehicle first"
                          : loadingVinNumbers
                            ? "Loading VIN numbers..."
                            : vinNumbersCount === 0
                              ? "No VIN numbers available"
                              : "Select VIN numbers"}
                  </Button>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
    </div>
  );
}
