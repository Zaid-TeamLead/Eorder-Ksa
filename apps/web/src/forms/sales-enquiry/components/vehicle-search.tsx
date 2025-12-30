"use client";

import { SearchCombobox } from "@/components/shared/search-combobox";

interface Vehicle {
  ItemCode: string;
  ItemName: string;
  FrgnName: string;
  ItmsGrpNam: string;
  SuppCatNum: string;
  U_Veh_Color: string;
  "Model Description": string;
  "Model Year": string;
  "Model Code": string;
  "Total Stock": number;
  "In Sales Orders": number;
  Allocated: number;
  Available: number;
}

interface VehicleSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => Promise<{ success: boolean; data: Vehicle[] } | undefined>;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export function VehicleSearch({
  value,
  onChange,
  onSearch,
  onVehicleSelect,
}: VehicleSearchProps) {
  return (
    <SearchCombobox<Vehicle>
      value={value}
      onChange={onChange}
      onSearch={onSearch}
      onSelect={(vehicle) => onVehicleSelect?.(vehicle)}
      placeholder="Search by Item Code or Item Name"
      getKey={(vehicle, index) => `${vehicle.ItemCode}-${vehicle.SuppCatNum || ''}-${index}`}
      getDisplayValue={(vehicle) => vehicle.ItemName || vehicle.ItemCode || ""}
      renderItem={(vehicle) => (
        <div className="flex flex-col gap-1 flex-1 py-2">
          <div className="font-medium text-sm">
            {vehicle.ItemName}
          </div>
          <div className="text-xs text-muted-foreground">
            {vehicle.ItemCode}
            {vehicle["Model Description"] && ` • ${vehicle["Model Description"]}`}
            {vehicle["Model Year"] && ` • ${vehicle["Model Year"]}`}
            {vehicle.U_Veh_Color && ` • ${vehicle.U_Veh_Color}`}
          </div>
          {vehicle.Available !== undefined && (
            <div className="text-xs text-muted-foreground mt-1">
              Available: {vehicle.Available} | Stock: {vehicle["Total Stock"]}
            </div>
          )}
        </div>
      )}
      emptyMessage="No vehicles found."
      className="p-4"
    />
  );
}
