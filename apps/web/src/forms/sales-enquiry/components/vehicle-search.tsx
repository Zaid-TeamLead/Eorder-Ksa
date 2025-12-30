"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Check } from "lucide-react";
import { logger } from '@/lib/logger';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ButtonLoading } from "@/components/shared/button-loading";

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
    const [open, setOpen] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    const handleSearch = async () => {
        if (!value.trim()) return;

        setIsSearching(true);
        try {
            const result = await onSearch(value);
            if (result?.success && result.data) {
                setVehicles(result.data);
                setOpen(true);
            }
        } catch (error) {
            logger.error("Search error:", error);
            setVehicles([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelect = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setOpen(false);
        onChange(vehicle.ItemName || vehicle.ItemCode || "");
        if (onVehicleSelect) {
            onVehicleSelect(vehicle);
        }
    };

    return (
        <div className="rounded-lg p-4 border space-y-3">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-[400px]">
                    <Input
                        id="vehicle-search"
                        value={value}
                        onChange={(e) => {
                            onChange(e.target.value);
                            setSelectedVehicle(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSearch();
                            }
                        }}
                        placeholder="Search by Item Code or Item Name"
                        className={cn(
                            "h-8 text-sm pr-8",
                            value && "border-primary ring-primary/20 ring-1"
                        )}
                    />
                    {selectedVehicle && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                            <Check className="w-3 h-3" />
                        </span>
                    )}
                </div>
                <Button
                    type="button"
                    size="sm"
                    onClick={handleSearch}
                    disabled={isSearching || !value.trim()}
                    className="h-8 shrink-0"
                >
                    {isSearching ? (
                        <ButtonLoading text="Searching..." size="sm" />
                    ) : (
                        <>
                            <Search className="w-3.5 h-3.5 mr-1.5" />
                            Search
                        </>
                    )}
                </Button>
            </div>

            {/* Search Results */}
            {open && vehicles.length > 0 && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <Command>
                        <CommandList>
                            <CommandGroup>
                                {vehicles.map((vehicle, index) => (
                                    <CommandItem
                                        key={`${vehicle.ItemCode}-${vehicle.SuppCatNum || ''}-${index}`}
                                        value={`${vehicle.ItemCode} ${vehicle.ItemName}`}
                                        onSelect={() => handleSelect(vehicle)}
                                        className="cursor-pointer"
                                    >
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
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            )}

            {open && vehicles.length === 0 && !isSearching && (
                <div className="text-sm text-muted-foreground text-center py-2">
                    No vehicles found.
                </div>
            )}
        </div>
    );
}

