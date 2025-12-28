"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconCar,
  IconCurrencyDollar,
  IconFileText,
} from "@tabler/icons-react";
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
import type { SalesEnquiry } from "@/services/enquiry";

// ============================================================================
// Constants
// ============================================================================

const statusColors: Record<string, string> = {
  Active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Contacted: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  Qualified: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Converted: "bg-green-500/10 text-green-600 border-green-500/20",
  Lost: "bg-red-500/10 text-red-600 border-red-500/20",
  Closed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

const priorityColors: Record<string, string> = {
  Low: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  Medium: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  High: "bg-red-500/10 text-red-600 border-red-500/20",
};

// ============================================================================
// Column Factory Function
// ============================================================================

export interface SalesEnquiryColumnHandlers {
  onViewEnquiry?: (enquiry: SalesEnquiry) => void;
  onEditEnquiry?: (enquiry: SalesEnquiry) => void;
  onDeleteEnquiry?: (id: number) => void;
  onStatusChange?: (id: number, status: string) => void;
  onTradeInAppraisal?: (enquiry: SalesEnquiry) => void;
  onBankFunding?: (enquiry: SalesEnquiry) => void;
  onGenerateQuotation?: (enquiry: SalesEnquiry) => void;
}

export function createSalesEnquiryColumns({
  onViewEnquiry,
  onEditEnquiry,
  onDeleteEnquiry,
  onStatusChange,
  onTradeInAppraisal,
  onBankFunding,
  onGenerateQuotation,
}: SalesEnquiryColumnHandlers): ColumnDef<SalesEnquiry>[] {
  return [
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
            <span className="font-medium">
              {make} {model}
            </span>
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
      cell: ({ row }) => <div>{row.original.BUDGET || "Not specified"}</div>,
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
        return (
          <Badge variant="outline" className={priorityColors[priority]}>
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
            <Button variant="ghost" className="h-8 w-8 p-0" size="icon">
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
            <DropdownMenuItem onClick={() => onTradeInAppraisal?.(row.original)}>
              <IconCar className="mr-2 h-4 w-4" />
              Trade-In Appraisal
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBankFunding?.(row.original)}>
              <IconCurrencyDollar className="mr-2 h-4 w-4" />
              Bank Funding
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onGenerateQuotation?.(row.original)}>
              <IconFileText className="mr-2 h-4 w-4" />
              Generate Quotation
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
  ];
}
