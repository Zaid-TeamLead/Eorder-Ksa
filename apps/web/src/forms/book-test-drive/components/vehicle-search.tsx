"use client";

import { SearchCombobox } from "@/components/shared/search-combobox";

interface Vehicle {
  ItemCode: string;
  ItemName: string;
  "Model Description": string;
  "Model Year": string;
  "Model Code": string;
  ItmsGrpNam: string;
  U_Veh_Color: string;
  SuppCatNum: string;
  Available?: number;
}

interface VehicleSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query?: string) => Promise<{ success: boolean; data: Vehicle[] } | undefined>;
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

export function VehicleSearch({
  value,
  onChange,
  onSearch,
  onVehicleSelect,
}: VehicleSearchProps) {
  // Wrapper for onSearch to handle optional query parameter
  const handleSearch = async (query: string) => {
    return onSearch(query.trim() || undefined);
  };

  return (
    <SearchCombobox<Vehicle>
      value={value}
      onChange={onChange}
      onSearch={handleSearch}
      onSelect={(vehicle) => onVehicleSelect?.(vehicle)}
      placeholder="Search vehicle by code, name, or model"
      getKey={(vehicle) => vehicle.ItemCode}
      getDisplayValue={(vehicle) => vehicle.ItemName || ""}
      renderItem={(vehicle) => (
        <div className="flex flex-col gap-0.5 flex-1 py-1.5">
          <div className="font-medium text-xs">
            {vehicle.ItemName}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {vehicle.ItemCode} • {vehicle["Model Description"]}
            {vehicle["Model Year"] && ` • ${vehicle["Model Year"]}`}
          </div>
        </div>
      )}
      emptyMessage="No vehicles found."
    />
  );
}
