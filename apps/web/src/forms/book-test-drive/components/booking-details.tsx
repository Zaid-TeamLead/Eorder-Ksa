"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { IconDots, IconCalendar } from "@tabler/icons-react";
import type { BookTestDriveFormData } from "../schema";

const branches = [
    { code: "0001", name: "01 Dubai Branch" },
    { code: "0002", name: "02 Riyadh Branch" },
    { code: "0003", name: "03 Jeddah Branch" },
];

const fuelLevels = [
    { value: "full", label: "Full 4/4", color: "bg-green-500" },
    { value: "high", label: "High 3/4", color: "bg-[#59ffff]" },
    { value: "half", label: "Half 1/2", color: "bg-blue-500" },
    { value: "low", label: "Low 1/4", color: "bg-yellow-500" },
    { value: "empty", label: "Empty", color: "bg-red-500" },
];

export function BookingDetails() {
    const form = useFormContext<BookTestDriveFormData>();
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-4 gap-3">
                <FormField
                    control={form.control}
                    name="dateIn"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Date In</FormLabel>
                            <FormControl>
                                <Input
                                    type="date"
                                    min={today}
                                    className="h-8 text-xs"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="timeIn"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Time In</FormLabel>
                            <FormControl>
                                <Input
                                    type="time"
                                    className="h-8 text-xs"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dateOut"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Date Out</FormLabel>
                            <FormControl>
                                <Input
                                    type="date"
                                    min={today}
                                    className="h-8 text-xs"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="timeOut"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Time Out</FormLabel>
                            <FormControl>
                                <Input
                                    type="time"
                                    className="h-8 text-xs"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />


            </div>

            <div className="grid grid-cols-4 gap-3">
                <FormField
                    control={form.control}
                    name="inBranch"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">In Branch</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    const branch = branches.find((b) => b.code === value);
                                    field.onChange(value);
                                    form.setValue("inBranchName", branch?.name || "");
                                }}
                                value={field.value || undefined}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.code} value={branch.code}>
                                            {branch.code} - {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="outBranch"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Out Branch</FormLabel>
                            <Select
                                onValueChange={(value) => {
                                    const branch = branches.find((b) => b.code === value);
                                    field.onChange(value);
                                    form.setValue("outBranchName", branch?.name || "");
                                }}
                                value={field.value || undefined}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.code} value={branch.code}>
                                            {branch.code} - {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />



                <FormField
                    control={form.control}
                    name="salesExecutive"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Sales Executive</FormLabel>
                            <FormControl>
                                <div className="flex gap-1">
                                    <Input className="h-8 text-xs flex-1" placeholder="Enter code" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="approvedBy"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Approved By</FormLabel>
                            <FormControl>
                                <div className="flex gap-1">
                                    <Input className="h-8 text-xs flex-1" placeholder="Enter code" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex items-center gap-6 pt-1">
                <FormField
                    control={form.control}
                    name="quickBooking"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel className="text-xs font-medium text-muted-foreground cursor-pointer">
                                Quick Booking
                            </FormLabel>
                        </FormItem>
                    )}
                />

                <div className="flex items-center gap-2">
                    <FormLabel className="text-xs font-medium text-muted-foreground">New/Used:</FormLabel>
                    <FormField
                        control={form.control}
                        name="newOrUsed"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <Select
                                        onValueChange={(value) => {
                                            field.onChange(value === "new" ? "N" : "U");
                                            form.setValue(
                                                "newOrUsedLabel",
                                                value === "new" ? "New vehicle" : "Used vehicle"
                                            );
                                        }}
                                        value={field.value === "N" ? "new" : field.value === "U" ? "used" : undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="h-8 text-xs w-[140px]">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="new">New vehicle</SelectItem>
                                            <SelectItem value="used">Used vehicle</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="fuelOut"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Fuel Out</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value && field.value.trim() !== "" ? field.value : undefined}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-8 text-xs w-[140px]">
                                        <SelectValue placeholder="Select fuel level" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {fuelLevels.map((level) => (
                                        <SelectItem
                                            key={level.value}
                                            value={level.value}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${level.color}`} />
                                                <span>{level.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fuelIn"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Fuel In</FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value && field.value.trim() !== "" ? field.value : undefined}
                            >
                                <FormControl>
                                    <SelectTrigger className="h-8 text-xs w-[140px]">
                                        <SelectValue placeholder="Select fuel level" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {fuelLevels.map((level) => (
                                        <SelectItem
                                            key={level.value}
                                            value={level.value}
                                            className="cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${level.color}`} />
                                                <span>{level.label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="mileageOut"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Mileage Out</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    className="h-8 text-xs w-[140px]"
                                    placeholder="Enter mileage"
                                    {...field}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="mileageIn"
                    render={({ field }) => (
                        <FormItem className="space-y-1.5">
                            <FormLabel className="text-xs font-medium text-muted-foreground">Mileage In</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    className="h-8 text-xs w-[140px]"
                                    placeholder="Enter mileage"
                                    {...field}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    );
}

