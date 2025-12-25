"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import type { VehicleInventory } from "@/services/vehicles";

export const createColumns = (
): ColumnDef<VehicleInventory>[] => [
    {
        accessorKey: "VIN",
        header: "VIN",
        cell: ({ row }) => (
            <div className="font-medium max-w-[150px] truncate">
                {row.getValue("VIN") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "Location",
        header: "Location",
        cell: ({ row }) => (
            <div className="max-w-[120px] truncate">
                {row.getValue("Location") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "WhsName",
        header: "Warehouse",
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate">
                {row.getValue("WhsName") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "ItemCode",
        header: "Item Code",
        cell: ({ row }) => (
            <div className="max-w-[120px] truncate">
                {row.getValue("ItemCode") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_Brand",
        header: "Brand",
        cell: ({ row }) => (
            <div className="max-w-[120px] truncate">
                {row.getValue("U_Veh_Brand") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_Model",
        header: "Model",
        cell: ({ row }) => (
            <div className="max-w-[120px] truncate">
                {row.getValue("U_Veh_Model") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_ModelDescr",
        header: "Model Description",
        cell: ({ row }) => (
            <div className="max-w-[180px] truncate">
                {row.getValue("U_Veh_ModelDescr") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_Color",
        header: "Color",
        cell: ({ row }) => (
            <div className="max-w-[100px] truncate">
                {row.getValue("U_Veh_Color") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_MY",
        header: "Model Year",
        cell: ({ row }) => (
            <div className="max-w-[100px] truncate">
                {row.getValue("U_Veh_MY") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Vehicle_MC",
        header: "MC",
        cell: ({ row }) => (
            <div className="max-w-[100px] truncate">
                {row.getValue("U_Vehicle_MC") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_OrderNo",
        header: "Order No",
        cell: ({ row }) => (
            <div className="max-w-[150px] truncate">
                {row.getValue("U_Veh_OrderNo") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "InDate",
        header: "In Date",
        cell: ({ row }) => {
            const inDate = row.getValue("InDate") as string;
            if (!inDate) return "-";
            try {
                const date = new Date(inDate);
                return (
                    <div className="text-xs">
                        {date.toLocaleDateString()}
                    </div>
                );
            } catch {
                return "-";
            }
        },
    },
    {
        accessorKey: "U_Veh_DispDate",
        header: "Dispatch Date",
        cell: ({ row }) => {
            const dispDate = row.getValue("U_Veh_DispDate") as string;
            if (!dispDate) return "-";
            try {
                const date = new Date(dispDate);
                return (
                    <div className="text-xs">
                        {date.toLocaleDateString()}
                    </div>
                );
            } catch {
                return "-";
            }
        },
    },
    {
        accessorKey: "AgeinDays",
        header: "Age (Days)",
        enableSorting: true,
        cell: ({ row }) => {
            const age = row.getValue("AgeinDays") as number;
            return (
                <Badge
                    variant={age > 30 ? "destructive" : age > 15 ? "default" : "secondary"}
                >
                    {age}
                </Badge>
            );
        },
    },
];

// Default columns for backward compatibility
export const columns = createColumns();

