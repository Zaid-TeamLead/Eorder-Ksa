"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
} from "@tanstack/react-table";
import { IconChevronDown } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for the filter input
 */
export interface FilterConfig {
  /** Column ID to filter on */
  columnId: string;
  /** Placeholder text for the filter input */
  placeholder: string;
  /** Optional custom filter function */
  filterFn?: (row: any, columnId: string, filterValue: any) => boolean;
}

/**
 * Configuration for toolbar actions
 */
export interface ToolbarAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "destructive";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Enable/disable pagination (default: true) */
  enabled?: boolean;
  /** Initial page size (default: 10) */
  initialPageSize?: number;
  /** Available page sizes (default: [10, 20, 30, 50]) */
  pageSizeOptions?: number[];
  /** Show rows per page selector (default: true) */
  showPageSizeSelector?: boolean;
  /** Custom pagination text formatter */
  formatPaginationText?: (
    currentStart: number,
    currentEnd: number,
    total: number
  ) => string;
}

/**
 * Column visibility configuration
 */
export interface ColumnVisibilityConfig {
  /** Enable/disable column visibility toggle (default: true) */
  enabled?: boolean;
  /** Button label (default: "Columns") */
  label?: string;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  /** Message to show when no data */
  message?: string;
  /** Optional custom empty state component */
  component?: React.ReactNode;
}

/**
 * Props for GenericDataTable component
 */
export interface GenericDataTableProps<TData, TValue> {
  /** Column definitions */
  columns: ColumnDef<TData, TValue>[];

  /** Data array */
  data: TData[];

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;

  /** Filter configuration (single column filter) */
  filterConfig?: FilterConfig;

  /** Pagination configuration */
  paginationConfig?: PaginationConfig;

  /** Column visibility configuration */
  columnVisibilityConfig?: ColumnVisibilityConfig;

  /** Toolbar actions (shown on right side) */
  toolbarActions?: ToolbarAction[];

  /** Empty state configuration */
  emptyStateConfig?: EmptyStateConfig;

  /** Enable row selection */
  enableRowSelection?: boolean;

  /** Row selection handler */
  onRowSelectionChange?: (selectedRows: TData[]) => void;

  /** Enable sorting (default: true) */
  enableSorting?: boolean;

  /** Initial sorting state */
  initialSorting?: SortingState;

  /** Initial column visibility */
  initialColumnVisibility?: VisibilityState;

  /** Custom table className */
  tableClassName?: string;

  /** Custom container className */
  containerClassName?: string;
}

// ============================================================================
// GenericDataTable Component
// ============================================================================

export function GenericDataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  error = null,
  filterConfig,
  paginationConfig = {},
  columnVisibilityConfig = {},
  toolbarActions = [],
  emptyStateConfig = {},
  enableRowSelection = false,
  onRowSelectionChange,
  enableSorting = true,
  initialSorting = [],
  initialColumnVisibility = {},
  tableClassName,
  containerClassName,
}: GenericDataTableProps<TData, TValue>) {
  // Default configuration values
  const {
    enabled: paginationEnabled = true,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 30, 50],
    showPageSizeSelector = true,
    formatPaginationText,
  } = paginationConfig;

  const {
    enabled: columnVisibilityEnabled = true,
    label: columnVisibilityLabel = "Columns",
  } = columnVisibilityConfig;

  const {
    message: emptyMessage = "No results found.",
    component: emptyComponent,
  } = emptyStateConfig;

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialColumnVisibility
  );
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Table instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      ...(paginationEnabled && { pagination }),
    },
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    ...(paginationEnabled && { onPaginationChange: setPagination }),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(enableSorting && { getSortedRowModel: getSortedRowModel() }),
    ...(paginationEnabled && { getPaginationRowModel: getPaginationRowModel() }),
    enableRowSelection,
  });

  // Notify parent of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection, table]);

  // Default pagination text formatter
  const defaultPaginationText = (start: number, end: number, total: number) => {
    return `Showing ${start} to ${end} of ${total} row(s)`;
  };

  const getPaginationText = () => {
    const start = pagination.pageIndex * pagination.pageSize + 1;
    const end = Math.min(
      (pagination.pageIndex + 1) * pagination.pageSize,
      table.getFilteredRowModel().rows.length
    );
    const total = table.getFilteredRowModel().rows.length;

    return formatPaginationText
      ? formatPaginationText(start, end, total)
      : defaultPaginationText(start, end, total);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-destructive">
          Error: {error.message}. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName || "w-full space-y-4"}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Filter Input */}
        {filterConfig && (
          <Input
            placeholder={filterConfig.placeholder}
            value={
              (table.getColumn(filterConfig.columnId)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn(filterConfig.columnId)
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm h-8"
          />
        )}

        {!filterConfig && <div />} {/* Spacer */}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Column Visibility Toggle */}
          {columnVisibilityEnabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {columnVisibilityLabel}{" "}
                  <IconChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Toolbar Actions */}
          {toolbarActions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              size={action.size || "sm"}
              onClick={action.onClick}
              className="h-8"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={tableClassName || "rounded-md border"}>
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyComponent || emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginationEnabled && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            {getPaginationText()}
          </div>
          <div className="flex items-center gap-2">
            {showPageSizeSelector && (
              <>
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={`${pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="w-20 h-8" id="rows-per-page">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
