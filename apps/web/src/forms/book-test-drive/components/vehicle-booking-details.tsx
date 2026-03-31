"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";

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
import { getAllTestVehicles, type TestVehicle } from "@/services/vehicles";
import type { BookTestDriveFormData } from "../schema";

function mapVehicleToBookingFields(vehicle: TestVehicle) {
    return {
        registrationNumber: vehicle.REGISTRATIONNUM || "",
        manufacturer: vehicle.MANUFACTURER || "",
        model: vehicle.MODEL || "",
        variant: vehicle.VARIANT || "",
        description: vehicle.DESCRIPTION || "",
        bodyStyle: vehicle.BODYSTYLE || "",
    };
}

export function VehicleBookingDetails() {
    const form = useFormContext<BookTestDriveFormData>();
    const selectedRegistrationNumber = form.watch("registrationNumber");

    const { data: testVehicles = [], isLoading } = useQuery({
        queryKey: ["book-test-drive-test-vehicles"],
        queryFn: getAllTestVehicles,
        staleTime: 5 * 60 * 1000,
    });

    const availableVehicles = useMemo(
        () =>
            testVehicles.filter(
                (vehicle) =>
                    vehicle.VEHICLESTSATUS === "true" ||
                    vehicle.REGISTRATIONNUM === selectedRegistrationNumber
            ),
        [selectedRegistrationNumber, testVehicles]
    );

    const handleVehicleSelect = (registrationNumber: string) => {
        const selectedVehicle = availableVehicles.find(
            (vehicle) => vehicle.REGISTRATIONNUM === registrationNumber
        );

        if (!selectedVehicle) {
            form.setValue("registrationNumber", registrationNumber, {
                shouldValidate: true,
                shouldDirty: true,
            });
            return;
        }

        const mapped = mapVehicleToBookingFields(selectedVehicle);

        form.setValue("registrationNumber", mapped.registrationNumber, {
            shouldValidate: true,
            shouldDirty: true,
        });
        form.setValue("manufacturer", mapped.manufacturer, {
            shouldValidate: true,
            shouldDirty: true,
        });
        form.setValue("model", mapped.model, {
            shouldValidate: true,
            shouldDirty: true,
        });
        form.setValue("variant", mapped.variant, {
            shouldValidate: true,
            shouldDirty: true,
        });
        form.setValue("description", mapped.description, {
            shouldValidate: true,
            shouldDirty: true,
        });
        form.setValue("bodyStyle", mapped.bodyStyle, {
            shouldValidate: true,
            shouldDirty: true,
        });
    };

    return (
        <div className="space-y-3">
            <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                    <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                            Registration Number
                        </FormLabel>
                        <Select
                            value={field.value || ""}
                            onValueChange={handleVehicleSelect}
                            disabled={isLoading}
                        >
                            <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Select registration number" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {availableVehicles.map((vehicle) => (
                                    <SelectItem
                                        key={vehicle.SLNO}
                                        value={vehicle.REGISTRATIONNUM || `vehicle-${vehicle.SLNO}`}
                                        className="text-xs"
                                    >
                                        {vehicle.REGISTRATIONNUM || `Vehicle ${vehicle.SLNO}`}
                                    </SelectItem>
                                ))}
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
                            <FormLabel className="text-xs font-medium text-muted-foreground">
                                Manufacturer
                            </FormLabel>
                            <FormControl>
                                <Input className="h-8 text-xs" placeholder="Auto-filled" {...field} />
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
                            <FormLabel className="text-xs font-medium text-muted-foreground">
                                Model
                            </FormLabel>
                            <FormControl>
                                <Input className="h-8 text-xs" placeholder="Auto-filled" {...field} />
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
                            <FormLabel className="text-xs font-medium text-muted-foreground">
                                Variant
                            </FormLabel>
                            <FormControl>
                                <Input className="h-8 text-xs" placeholder="Auto-filled" {...field} />
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
                            <FormLabel className="text-xs font-medium text-muted-foreground">
                                Body Style
                            </FormLabel>
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
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                            Description
                        </FormLabel>
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
