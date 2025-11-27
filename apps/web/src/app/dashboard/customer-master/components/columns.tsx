"use client";

import { type ColumnDef } from "@tanstack/react-table";

export interface VehicleHistory {
    CardCode: string;
    DocNum: number;
    DocDate: string;
    CardName: string;
    WhsCode: string;
    Location: string;
    ItemCode: string;
    MnfSerial: string;
    InDate: string;
    U_Veh_StockID: string | null;
    U_Veh_Brand: string | null;
    U_Veh_Model: string | null;
    U_Veh_Color: string | null;
    U_Veh_Transmutation: string | null;
    U_Veh_ModelDescr: string | null;
    U_Veh_ModelFull: string | null;
    U_Veh_EngineNo: string | null;
    U_Veh_MY: string | null;
    U_Vehicle_MC: string | null;
    U_Veh_OrderNo: string | null;
    U_Veh_DispDate: string | null;
    U_Veh_IC: string | null;
}

export const columns: ColumnDef<VehicleHistory>[] = [
    {
        accessorKey: "DocNum",
        header: "Doc #",
        cell: ({ row }) => (
            <div className="font-medium max-w-[80px] truncate text-xs">
                {row.getValue("DocNum") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "DocDate",
        header: "Date",
        enableSorting: true,
        cell: ({ row }) => {
            const docDate = row.getValue("DocDate") as string;
            if (!docDate) return <span className="text-xs">-</span>;
            try {
                const date = new Date(docDate);
                return (
                    <div className="text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                );
            } catch {
                return <span className="text-xs">-</span>;
            }
        },
    },
    {
        accessorKey: "ItemCode",
        header: "Item",
        cell: ({ row }) => (
            <div className="max-w-[100px] truncate text-xs">
                {row.getValue("ItemCode") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "MnfSerial",
        header: "Serial",
        cell: ({ row }) => (
            <div className="max-w-[120px] truncate text-[10px]" style={{ fontFamily: 'var(--font-mono)' }}>
                {row.getValue("MnfSerial") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_ModelDescr",
        header: "Model",
        cell: ({ row }) => (
            <div className="max-w-[120px] truncate text-xs">
                {row.getValue("U_Veh_ModelDescr") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_Color",
        header: "Color",
        cell: ({ row }) => (
            <div className="max-w-[80px] truncate text-xs">
                {row.getValue("U_Veh_Color") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_MY",
        header: "Year",
        cell: ({ row }) => (
            <div className="max-w-[60px] truncate text-xs">
                {row.getValue("U_Veh_MY") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Vehicle_MC",
        header: "MC",
        cell: ({ row }) => (
            <div className="max-w-[80px] truncate text-xs">
                {row.getValue("U_Vehicle_MC") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "U_Veh_OrderNo",
        header: "Order",
        cell: ({ row }) => (
            <div className="max-w-[100px] truncate text-xs">
                {row.getValue("U_Veh_OrderNo") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "Location",
        header: "Location",
        cell: ({ row }) => (
            <div className="max-w-[100px] truncate text-xs">
                {row.getValue("Location") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "WhsCode",
        header: "Whs",
        cell: ({ row }) => (
            <div className="max-w-[80px] truncate text-xs">
                {row.getValue("WhsCode") || "-"}
            </div>
        ),
    },
    {
        accessorKey: "InDate",
        header: "In Date",
        enableSorting: true,
        cell: ({ row }) => {
            const inDate = row.getValue("InDate") as string;
            if (!inDate) return <span className="text-xs">-</span>;
            try {
                const date = new Date(inDate);
                return (
                    <div className="text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                );
            } catch {
                return <span className="text-xs">-</span>;
            }
        },
    },
    {
        accessorKey: "U_Veh_DispDate",
        header: "Dispatch",
        enableSorting: true,
        cell: ({ row }) => {
            const dispDate = row.getValue("U_Veh_DispDate") as string;
            if (!dispDate) return <span className="text-xs">-</span>;
            try {
                const date = new Date(dispDate);
                return (
                    <div className="text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                );
            } catch {
                return <span className="text-xs">-</span>;
            }
        },
    },
];

