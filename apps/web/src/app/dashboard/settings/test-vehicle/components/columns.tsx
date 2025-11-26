"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import type { TestVehicle } from "@/services/vehicles";

export const createColumns = (
    onEdit: (vehicle: TestVehicle) => void,
    onToggleStatus: (vehicle: TestVehicle) => void
): ColumnDef<TestVehicle>[] => {
    return [
        {
            accessorKey: "SLNO",
            header: "ID",
            cell: ({ row }) => <div className="font-medium">{row.getValue("SLNO")}</div>,
        },
        {
            accessorKey: "REGISTRATIONNUM",
            header: "Registration Number",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate">
                    {row.getValue("REGISTRATIONNUM") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "MANUFACTURER",
            header: "Manufacturer",
            cell: ({ row }) => (
                <div className="max-w-[150px] truncate">
                    {row.getValue("MANUFACTURER") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "MODEL",
            header: "Model",
            cell: ({ row }) => (
                <div className="max-w-[150px] truncate">
                    {row.getValue("MODEL") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "VARIANT",
            header: "Variant",
            cell: ({ row }) => (
                <div className="max-w-[150px] truncate">
                    {row.getValue("VARIANT") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "BODYSTYLE",
            header: "Body Style",
            cell: ({ row }) => (
                <div className="max-w-[120px] truncate">
                    {row.getValue("BODYSTYLE") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "VEHICLESTSATUS",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("VEHICLESTSATUS") as string;
                return (
                    <Badge
                        variant={status === "true" ? "default" : "secondary"}
                        className={
                            status === "true"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-500 hover:bg-gray-600"
                        }
                    >
                        {status === "true" ? "Active" : "Inactive"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const vehicle = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <IconDotsVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                                <IconEdit className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onToggleStatus(vehicle)}
                                className={
                                    vehicle.VEHICLESTSATUS === "true"
                                        ? "text-destructive"
                                        : "text-green-600"
                                }
                            >
                                <IconTrash className="mr-2 h-4 w-4" />
                                {vehicle.VEHICLESTSATUS === "true"
                                    ? "Deactivate"
                                    : "Activate"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
};

