'use client';

import { useMemo, useState } from 'react';
import {
  Printer,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  CircleX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuotations } from '@/hooks/entities/useQuotations';

// Shared utilities and components
import { formatCurrency, formatDate } from '@/lib/formatters';
import { LoadingState } from '@/components/shared/loading-state';
import { TableEmptyRow } from '@/components/shared/table-empty-row';
import { QuotationStatusBadge } from '@/components/quotation/status-badge';
import { CancelQuotationDialog } from '@/components/quotation/cancel-quotation-dialog';
import type { QuotationFilters } from '@/types/quotation';

// Custom hooks
import { useQuotationActions } from '@/hooks/quotation/useQuotationActions';

const QUOTATION_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_QUOTATION_PAGE_SIZE = 20;

export default function QuotationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_QUOTATION_PAGE_SIZE);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [quotationToCancel, setQuotationToCancel] = useState<{
    id: number;
    number: string;
  } | null>(null);

  const quotationFilters = useMemo<QuotationFilters>(
    () => ({
      limit: pageSize + 1,
      offset: pageIndex * pageSize,
      ...(statusFilter === 'all'
        ? {}
        : { status: statusFilter as QuotationFilters['status'] }),
    }),
    [pageIndex, pageSize, statusFilter]
  );

  const { quotations, isLoading, isFetching, refetch } = useQuotations(quotationFilters);
  const visibleQuotations = quotations.slice(0, pageSize);
  const hasNextPage = quotations.length > pageSize;
  const hasPreviousPage = pageIndex > 0;
  const pageStart = pageIndex * pageSize + 1;
  const pageEnd = pageIndex * pageSize + visibleQuotations.length;

  const {
    handleView,
    handlePrint,
    handleEdit,
    handleDelete,
    handleCancel,
    handleSupersede,
    isCancelling,
  } =
    useQuotationActions({
      onSuccess: () => refetch(),
    });

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPageIndex(0);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPageIndex(0);
  };

  if (isLoading) {
    return <LoadingState message="Loading quotations..." />;
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quotations</CardTitle>
              <CardDescription>Manage and track all sales quotations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Superseded">Superseded</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {visibleQuotations.length === 0
                  ? 'No quotations on this page'
                  : `Showing ${pageStart}-${pageEnd}`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-9 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUOTATION_PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
                disabled={!hasPreviousPage || isFetching}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((current) => current + 1)}
                disabled={!hasNextPage || isFetching}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleQuotations.length === 0 ? (
                  <TableEmptyRow colSpan={8} message="No quotations found." />
                ) : (
                  visibleQuotations.map((quotation) => (
                    <TableRow key={quotation.SLNO}>
                      <TableCell className="font-medium">
                        {quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">V{quotation.VERSION}</Badge>
                          {quotation.IS_LATEST_VERSION === 'Y' && (
                            <Badge variant="default" className="text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quotation.CUSTOMER_NAME || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">
                            {quotation.CUSTOMER_MOBILE || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {quotation.VEHICLE_MAKE} {quotation.VEHICLE_MODEL}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quotation.VEHICLE_VARIANT}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(quotation.GRAND_TOTAL)}
                      </TableCell>
                      <TableCell>
                        <QuotationStatusBadge status={quotation.STATUS} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(quotation.CREATED_DATE)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleView(quotation.SLNO)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {quotation.STATUS === 'Draft' && (
                              <DropdownMenuItem onClick={() => handleEdit(quotation.SLNO)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handlePrint(quotation)}>
                              <Printer className="mr-2 h-4 w-4" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSupersede(quotation.SLNO)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Create New Version
                            </DropdownMenuItem>
                            {quotation.STATUS !== 'Cancelled' &&
                              quotation.STATUS !== 'Superseded' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setQuotationToCancel({
                                    id: quotation.SLNO,
                                    number:
                                      quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER,
                                  });
                                  setIsCancelDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <CircleX className="mr-2 h-4 w-4" />
                                Cancel Quotation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(quotation.SLNO)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <CancelQuotationDialog
            open={isCancelDialogOpen}
            onOpenChange={(open) => {
              setIsCancelDialogOpen(open);
              if (!open) {
                setQuotationToCancel(null);
              }
            }}
            quotationNumber={quotationToCancel?.number}
            isCancelling={isCancelling}
            onConfirm={async (reason) => {
              if (!quotationToCancel) return;
              await handleCancel(
                {
                  cancellationReason: reason,
                },
                quotationToCancel.id
              );
              setQuotationToCancel(null);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
