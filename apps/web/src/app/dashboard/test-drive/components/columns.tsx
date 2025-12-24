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
import { IconDotsVertical, IconEye, IconEdit, IconTrash } from "@tabler/icons-react";
import type { BookTestDrive } from "@/services/bookTestDrive";

export const createColumns = (
    onView?: (booking: BookTestDrive) => void,
    onEdit?: (booking: BookTestDrive) => void,
    onDelete?: (id: number) => void
): ColumnDef<BookTestDrive>[] => {
    return [
        {
            accessorKey: "SLNO",
            header: "ID",
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue("SLNO")}</div>
            ),
        },
        {
            accessorKey: "CUSTOMERNAME",
            header: "Customer Name",
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate">
                    {row.getValue("CUSTOMERNAME") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "REGISTRATIONNUM",
            header: "Registration",
            cell: ({ row }) => (
                <div className="max-w-[150px] truncate">
                    {row.getValue("REGISTRATIONNUM") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "MANUFACTURER",
            header: "Manufacturer",
            cell: ({ row }) => (
                <div className="max-w-[120px] truncate">
                    {row.getValue("MANUFACTURER") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "MODEL",
            header: "Model",
            cell: ({ row }) => (
                <div className="max-w-[120px] truncate">
                    {row.getValue("MODEL") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "DATEOUT",
            header: "Date Out",
            cell: ({ row }) => {
                const dateOut = row.getValue("DATEOUT") as string;
                if (!dateOut) return "-";
                const date = new Date(dateOut);
                return (
                    <div className="text-xs">
                        {date.toLocaleDateString()}
                    </div>
                );
            },
        },
        {
            accessorKey: "DATEIN",
            header: "Date In",
            cell: ({ row }) => {
                const dateIn = row.getValue("DATEIN") as string;
                if (!dateIn) return "-";
                const date = new Date(dateIn);
                return (
                    <div className="text-xs">
                        {date.toLocaleDateString()}
                    </div>
                );
            },
        },
        {
            accessorKey: "OUTBRANCHNAME",
            header: "Out Branch",
            cell: ({ row }) => (
                <div className="max-w-[150px] truncate">
                    {row.getValue("OUTBRANCHNAME") || "-"}
                </div>
            ),
        },
        {
            accessorKey: "STATUS",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("STATUS") as string;
                const isActive = status === "active";
                return (
                    <Badge
                        variant={isActive ? "default" : "secondary"}
                        className={
                            isActive
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-500 hover:bg-gray-600"
                        }
                    >
                        {isActive ? "Active" : "Inactive"}
                    </Badge>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const booking = row.original;
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
                            {onView && (
                                <DropdownMenuItem onClick={() => onView(booking)}>
                                    <IconEye className="mr-2 h-4 w-4" />
                                    View Details
                                </DropdownMenuItem>
                            )}
                            {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(booking)}>
                                    <IconEdit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onClick={() => onDelete(booking.SLNO)}
                                    >
                                        <IconTrash className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];
};

