"use client";

import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAllTestVehicles } from "@/services/vehicles";
import { IconDots } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import type { BookTestDriveFormData } from "../schema";

export function VehicleBookingDetails() {
    const form = useFormContext<BookTestDriveFormData>();

    const { data: vehicles = [], isLoading } = useQuery({
        queryKey: ["test-vehicles"],
        queryFn: getAllTestVehicles,
    });

    // Filter only active vehicles
    const activeVehicles = vehicles.filter(
        (v) => v.VEHICLESTSATUS === "true"
    );

    const handleVehicleSelect = (slno: string) => {
        // Find vehicle by SLNO (serial number)
        const vehicleId = parseInt(slno, 10);
        const vehicle = activeVehicles.find((v) => v.SLNO === vehicleId);

        if (vehicle) {
            form.setValue("registrationNumber", vehicle.REGISTRATIONNUM || "", { shouldValidate: true, shouldDirty: true });
            form.setValue("manufacturer", vehicle.MANUFACTURER || "", { shouldValidate: true, shouldDirty: true });
            form.setValue("model", vehicle.MODEL || "", { shouldValidate: true, shouldDirty: true });
            form.setValue("variant", vehicle.VARIANT || "", { shouldValidate: true, shouldDirty: true });
            form.setValue("description", vehicle.DESCRIPTION || "", { shouldValidate: true, shouldDirty: true });
            form.setValue("bodyStyle", vehicle.BODYSTYLE || "", { shouldValidate: true, shouldDirty: true });
        }
    };

    return (
        <div className="space-y-3">
            <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-medium text-muted-foreground">Registration Number</FormLabel>
                        <Select
                            onValueChange={(value) => {
                                if (value !== "no-vehicles") {
                                    handleVehicleSelect(value);
                                }
                            }}
                            value={
                                field.value
                                    ? activeVehicles.find(v => v.REGISTRATIONNUM === field.value)?.SLNO.toString() || undefined
                                    : undefined
                            }
                            disabled={isLoading}
                        >
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select vehicle" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {activeVehicles.length === 0 && !isLoading && (
                                    <SelectItem value="no-vehicles" disabled>
                                        No vehicles available
                                    </SelectItem>
                                )}
                                {activeVehicles.map((vehicle) => {
                                    const regNum = vehicle.REGISTRATIONNUM || `Vehicle #${vehicle.SLNO}`;
                                    return (
                                        <SelectItem
                                            key={vehicle.SLNO}
                                            value={vehicle.SLNO.toString()}
                                        >
                                            {regNum}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px]" />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-3">
                <FormField
                    control={form.control}
                    name="manufacturer"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Manufacturer</FormLabel>
                            <FormControl>
                                <div className="flex gap-1">
                                    <Input className="h-8 text-xs flex-1" placeholder="Auto-filled" {...field} />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 shrink-0"
                                    >
                                        <IconDots className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Model</FormLabel>
                            <FormControl>
                                <div className="flex gap-1">
                                    <Input className="h-8 text-xs flex-1" placeholder="Auto-filled" {...field} />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 shrink-0"
                                    >
                                        <IconDots className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <FormField
                    control={form.control}
                    name="variant"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Variant</FormLabel>
                            <FormControl>
                                <div className="flex gap-1">
                                    <Input className="h-8 text-xs flex-1" placeholder="Auto-filled" {...field} />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0 shrink-0"
                                    >
                                        <IconDots className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="bodyStyle"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Body Style</FormLabel>
                            <FormControl>
                                <Input className="h-8 text-xs" placeholder="Auto-filled" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-medium text-muted-foreground">Description</FormLabel>
                        <FormControl>
                            <Input className="h-8 text-xs" placeholder="Auto-filled" {...field} />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                    </FormItem>
                )}
            />
        </div>
    );
}

