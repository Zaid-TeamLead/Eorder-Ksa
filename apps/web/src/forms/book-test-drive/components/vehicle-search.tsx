"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { logger } from '@/lib/logger';
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { ButtonLoading } from "@/components/shared/button-loading";

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
    const [open, setOpen] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    const handleSearch = async () => {
        setIsSearching(true);
        try {
            const result = await onSearch(value.trim() || undefined);
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
        if (onVehicleSelect) {
            onVehicleSelect(vehicle);
        }
    };

    return (
        <div className="rounded-lg p-2.5 border space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                    <div className="relative flex-1 max-w-[240px]">
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
                            placeholder="Search vehicle by code, name, or model"
                            className={cn(
                                "h-7 text-xs pr-7",
                                value && "border-primary ring-primary/20 ring-1"
                            )}
                        />
                        {selectedVehicle && (
                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-medium">
                                <Search className="w-2.5 h-2.5" />
                            </span>
                        )}
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="h-7 shrink-0 text-xs px-2"
                    >
                        {isSearching ? (
                            <ButtonLoading text="Searching..." size="sm" />
                        ) : (
                            <>
                                <Search className="w-3 h-3 mr-1" />
                                Search
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Search Results */}
            {open && vehicles.length > 0 && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <Command>
                        <CommandList>
                            <CommandGroup>
                                {vehicles.map((vehicle) => (
                                    <CommandItem
                                        key={vehicle.ItemCode}
                                        value={vehicle.ItemName}
                                        onSelect={() => handleSelect(vehicle)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex flex-col gap-0.5 flex-1 py-1.5">
                                            <div className="font-medium text-xs">
                                                {vehicle.ItemName}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {vehicle.ItemCode} • {vehicle["Model Description"]}
                                                {vehicle["Model Year"] && ` • ${vehicle["Model Year"]}`}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            )}

            {open && vehicles.length === 0 && !isSearching && (
                <div className="text-xs text-muted-foreground text-center py-1.5">
                    No vehicles found.
                </div>
            )}
        </div>
    );
}

