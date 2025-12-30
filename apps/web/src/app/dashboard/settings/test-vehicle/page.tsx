"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAllTestVehicles,
    createTestVehicle,
    updateTestVehicle,
    updateTestVehicleStatus,
    type TestVehicle,
    type CreateTestVehicleData,
} from "@/services/vehicles";
import { DataTable } from "./components/data-table";
import { createColumns } from "./components/columns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ButtonLoading } from "@/components/shared/button-loading";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { IconLoader } from "@tabler/icons-react";

const testVehicleSchema = z.object({
    REGISTRATIONNUM: z.string().optional(),
    MANUFACTURER: z.string().optional(),
    MODEL: z.string().optional(),
    VARIANT: z.string().optional(),
    DESCRIPTION: z.string().optional(),
    BODYSTYLE: z.string().optional(),
    VEHICLESTATUS: z.enum(["true", "false"]).optional(),
});

type TestVehicleFormData = z.infer<typeof testVehicleSchema>;

export default function TestVehiclePage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<TestVehicle | null>(
        null
    );

    const { data, isLoading, error } = useQuery({
        queryKey: ["test-vehicles"],
        queryFn: getAllTestVehicles,
    });

    const form = useForm<TestVehicleFormData>({
        resolver: zodResolver(testVehicleSchema),
        defaultValues: {
            REGISTRATIONNUM: "",
            MANUFACTURER: "",
            MODEL: "",
            VARIANT: "",
            DESCRIPTION: "",
            BODYSTYLE: "",
            VEHICLESTATUS: "true",
        },
    });

    const createMutation = useMutation({
        mutationFn: createTestVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["test-vehicles"] });
            toast.success("Test vehicle created successfully");
            setIsDialogOpen(false);
            form.reset();
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message || "Failed to create test vehicle"
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: CreateTestVehicleData }) =>
            updateTestVehicle(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["test-vehicles"] });
            toast.success("Test vehicle updated successfully");
            setIsDialogOpen(false);
            setEditingVehicle(null);
            form.reset();
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message || "Failed to update test vehicle"
            );
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: "true" | "false" }) =>
            updateTestVehicleStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["test-vehicles"] });
            toast.success(
                `Test vehicle ${variables.status === "true" ? "activated" : "deactivated"} successfully`
            );
        },
        onError: (error: any) => {
            toast.error(
                error.response?.data?.error?.message || "Failed to update test vehicle status"
            );
        },
    });

    const handleAdd = () => {
        setEditingVehicle(null);
        form.reset({
            REGISTRATIONNUM: "",
            MANUFACTURER: "",
            MODEL: "",
            VARIANT: "",
            DESCRIPTION: "",
            BODYSTYLE: "",
            VEHICLESTATUS: "true",
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (vehicle: TestVehicle) => {
        setEditingVehicle(vehicle);
        form.reset({
            REGISTRATIONNUM: vehicle.REGISTRATIONNUM || "",
            MANUFACTURER: vehicle.MANUFACTURER || "",
            MODEL: vehicle.MODEL || "",
            VARIANT: vehicle.VARIANT || "",
            DESCRIPTION: vehicle.DESCRIPTION || "",
            BODYSTYLE: vehicle.BODYSTYLE || "",
            VEHICLESTATUS:
                (vehicle.VEHICLESTSATUS === "true" ? "true" : "false") as "true" | "false",
        });
        setIsDialogOpen(true);
    };

    const handleToggleStatus = (vehicle: TestVehicle) => {
        const isActive = vehicle.VEHICLESTSATUS === "true";
        const newStatus = isActive ? "false" : "true";
        const action = isActive ? "deactivate" : "activate";

        if (
            confirm(
                `Are you sure you want to ${action} vehicle ${vehicle.REGISTRATIONNUM || vehicle.SLNO}?`
            )
        ) {
            toggleStatusMutation.mutate({
                id: vehicle.SLNO,
                status: newStatus as "true" | "false",
            });
        }
    };

    const onSubmit = (data: TestVehicleFormData) => {
        if (editingVehicle) {
            updateMutation.mutate({ id: editingVehicle.SLNO, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const columns = React.useMemo(
        () => createColumns(handleEdit, handleToggleStatus),
        []
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <IconLoader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-destructive">
                Error: {error instanceof Error ? error.message : "Failed to load vehicles"}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Test Vehicle</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage test vehicle settings and configurations
                </p>
            </div>

            <DataTable
                columns={columns}
                data={data || []}
                onAdd={handleAdd}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingVehicle ? "Edit Test Vehicle" : "Add Test Vehicle"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingVehicle
                                ? "Update the test vehicle information below."
                                : "Fill in the test vehicle information below."}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="REGISTRATIONNUM"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Registration Number</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter registration number" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="MANUFACTURER"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Manufacturer</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter manufacturer" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="MODEL"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Model</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter model" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="VARIANT"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Variant</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter variant" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="BODYSTYLE"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Body Style</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Enter body style" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="VEHICLESTATUS"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="true">Active</SelectItem>
                                                    <SelectItem value="false">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="DESCRIPTION"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <textarea
                                                {...field}
                                                rows={3}
                                                placeholder="Enter description"
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        form.reset();
                                        setEditingVehicle(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {createMutation.isPending || updateMutation.isPending ? (
                                        <ButtonLoading text="Saving..." />
                                    ) : (
                                        editingVehicle ? "Update" : "Create"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
