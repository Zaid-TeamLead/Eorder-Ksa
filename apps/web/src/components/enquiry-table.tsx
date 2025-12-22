"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import type { SalesEnquiry } from "@/services/enquiry";

interface EnquiryTableProps {
  data: SalesEnquiry[];
  onNewEnquiry: () => void;
  onViewEnquiry?: (enquiry: SalesEnquiry) => void;
  onEditEnquiry?: (enquiry: SalesEnquiry) => void;
  onDeleteEnquiry?: (id: number) => void;
  onStatusChange?: (id: number, status: string) => void;
}

const statusColors: Record<string, string> = {
  Active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Contacted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Qualified: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Converted: "bg-green-500/10 text-green-600 border-green-500/20",
  Lost: "bg-red-500/10 text-red-600 border-red-500/20",
  Closed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export function EnquiryTable({
  data,
  onNewEnquiry,
  onViewEnquiry,
  onEditEnquiry,
  onDeleteEnquiry,
  onStatusChange,
}: EnquiryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns: ColumnDef<SalesEnquiry>[] = useMemo(() => [
    {
      accessorKey: "SLNO",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.original.SLNO}</div>,
    },
    {
      accessorKey: "CUSTOMERNAME",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.CUSTOMERNAME || "N/A"}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.MOBILE}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "VEHICLE",
      header: "Vehicle",
      cell: ({ row }) => {
        const make = row.original.MAKENAME || row.original.MAKE;
        const model = row.original.MODELNAME || row.original.MODEL;
        const variant = row.original.VARIANTNAME || row.original.VARIANT;

        return (
          <div className="flex flex-col">
            <span className="font-medium">{make} {model}</span>
            {variant && (
              <span className="text-xs text-muted-foreground">{variant}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "BUDGET",
      header: "Budget",
      cell: ({ row }) => (
        <div>{row.original.BUDGET || "Not specified"}</div>
      ),
    },
    {
      accessorKey: "STATUS",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.STATUS || "Active";
        return (
          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange?.(row.original.SLNO, value)
            }
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue>
                <Badge
                  variant="outline"
                  className={statusColors[status] || ""}
                >
                  {status}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: "PRIORITY",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.original.PRIORITY || "Medium";
        const colors: Record<string, string> = {
          Low: "bg-gray-500/10 text-gray-600 border-gray-500/20",
          Medium: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          High: "bg-red-500/10 text-red-600 border-red-500/20",
        };
        return (
          <Badge variant="outline" className={colors[priority]}>
            {priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "SALESPERSON",
      header: "Salesperson",
      cell: ({ row }) => (
        <div className="text-sm">{row.original.SALESPERSON || "N/A"}</div>
      ),
    },
    {
      accessorKey: "CREATEDDATE",
      header: "Created",
      cell: ({ row }) => {
        const date = row.original.CREATEDDATE;
        if (!date) return "N/A";
        try {
          return new Date(date).toLocaleDateString();
        } catch {
          return date;
        }
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              size="icon"
            >
              <IconDotsVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewEnquiry?.(row.original)}>
              <IconEye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditEnquiry?.(row.original)}>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDeleteEnquiry?.(row.original.SLNO)}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [onStatusChange, onViewEnquiry, onEditEnquiry, onDeleteEnquiry]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button onClick={onNewEnquiry} size="sm">
          <IconPlus className="mr-2 h-4 w-4" />
          Create New Enquiry
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No enquiries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} enquiries
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Rows per page
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-20 h-8" id="rows-per-page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
