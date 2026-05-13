'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useSalesOrders } from '@/hooks/entities/useSalesOrders';
import { useSalesOrderMutations } from '@/hooks/entities/useSalesOrderMutations';
import { useQuotations } from '@/hooks/entities/useQuotations';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { TableEmptyRow } from '@/components/shared/table-empty-row';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { DASHBOARD_LIST_LIMIT } from '@/lib/list-limits';
import type { SalesOrderFilters } from '@/types/salesOrder';

const createSalesOrderSchema = z.object({
  quotationSlno: z.coerce.number().int().positive('Valid quotation ID is required'),
  notes: z.string().max(5000).optional(),
});

type CreateSalesOrderFormData = z.infer<typeof createSalesOrderSchema>;

const SALES_ORDER_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const DEFAULT_SALES_ORDER_PAGE_SIZE = 20;

export default function SalesOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationIdParam = searchParams.get('quotationId');
  const quotationNumberParam = searchParams.get('quotationNumber');
  const hasConsumedQuotationParam = useRef(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_SALES_ORDER_PAGE_SIZE);

  const salesOrderFilters = useMemo<SalesOrderFilters>(
    () => ({
      limit: pageSize + 1,
      offset: pageIndex * pageSize,
      ...(statusFilter === 'all'
        ? {}
        : { status: statusFilter as SalesOrderFilters['status'] }),
    }),
    [pageIndex, pageSize, statusFilter]
  );

  const { salesOrders, isLoading, isFetching, error, refetch } = useSalesOrders(salesOrderFilters);
  const shouldLoadCreateDialogData = createDialogOpen || Boolean(quotationIdParam);
  const { salesOrders: salesOrdersForSelection } = useSalesOrders(
    { limit: DASHBOARD_LIST_LIMIT },
    { enabled: shouldLoadCreateDialogData }
  );
  const { quotations, isLoading: isLoadingQuotations } = useQuotations({
    limit: DASHBOARD_LIST_LIMIT,
  }, { enabled: shouldLoadCreateDialogData });
  const { createFromQuotation, isCreating } = useSalesOrderMutations();
  const visibleSalesOrders = salesOrders.slice(0, pageSize);
  const hasNextPage = salesOrders.length > pageSize;
  const hasPreviousPage = pageIndex > 0;
  const pageStart = pageIndex * pageSize + 1;
  const pageEnd = pageIndex * pageSize + visibleSalesOrders.length;

  const usedQuotationIds = new Set(
    salesOrdersForSelection
      .map((order) => Number(order.QUOTATION_SLNO))
      .filter((quotationId) => Number.isFinite(quotationId) && quotationId > 0)
  );

  const availableQuotations = quotations.filter(
    (quotation) =>
      quotation.IS_LATEST_VERSION === 'Y' &&
      quotation.STATUS !== 'Cancelled' &&
      quotation.STATUS !== 'Superseded' &&
      !usedQuotationIds.has(Number(quotation.SLNO))
  );

  const form = useForm<CreateSalesOrderFormData>({
    resolver: zodResolver(createSalesOrderSchema) as any,
    defaultValues: {
      quotationSlno: 0,
      notes: '',
    },
  });
  const selectedQuotationId = form.watch('quotationSlno');
  const selectedQuotation = quotations.find(
    (quotation) => Number(quotation.SLNO) === Number(selectedQuotationId)
  );
  const selectedQuotationNumber =
    selectedQuotation?.ROOT_QUOTATION_NUMBER ||
    selectedQuotation?.QUOTATION_NUMBER ||
    quotationNumberParam ||
    '';
  const selectedQuotationOptionLabel =
    selectedQuotation
      ? `${selectedQuotation.ROOT_QUOTATION_NUMBER || selectedQuotation.QUOTATION_NUMBER} - ${selectedQuotation.CUSTOMER_NAME || 'No customer'}${selectedQuotation.VERSION > 1 ? ` (V${selectedQuotation.VERSION})` : ''}`
      : selectedQuotationNumber
        ? `${selectedQuotationNumber} - Selected quotation`
        : '';
  const shouldRenderSelectedQuotationOption =
    Number(selectedQuotationId) > 0 &&
    Boolean(selectedQuotationOptionLabel) &&
    !availableQuotations.some(
      (quotation) => Number(quotation.SLNO) === Number(selectedQuotationId)
    );

  useEffect(() => {
    if (!quotationIdParam || hasConsumedQuotationParam.current) return;
    const quotationId = Number.parseInt(quotationIdParam, 10);
    if (!Number.isNaN(quotationId) && quotationId > 0) {
      form.setValue('quotationSlno', quotationId);
      setCreateDialogOpen(true);
      hasConsumedQuotationParam.current = true;
      router.replace('/dashboard/sales-order');
    }
  }, [quotationIdParam, form, router]);

  const onSubmit = async (data: CreateSalesOrderFormData) => {
    const result = await createFromQuotation(data);
    setCreateDialogOpen(false);
    form.reset({ quotationSlno: 0, notes: '' });
    await refetch();
    router.push(`/dashboard/sales-order/${result.id}`);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPageIndex(0);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setPageIndex(0);
  };

  if (isLoading) {
    return <LoadingState message="Loading sales orders..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Sales Orders"
        message={error.message || 'Failed to load sales orders'}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sales Orders</CardTitle>
              <CardDescription>Create and manage sales orders</CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Sales Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-64">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Provisional">Provisional</SelectItem>
                    <SelectItem value="Printed">Printed</SelectItem>
                    <SelectItem value="PassedToVehicleAdmin">Passed to Vehicle Admin</SelectItem>
                    <SelectItem value="HandoverBooked">Handover Booked</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                    <SelectItem value="Superseded">Superseded</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {visibleSalesOrders.length === 0
                  ? 'No sales orders on this page'
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
                  {SALES_ORDER_PAGE_SIZE_OPTIONS.map((size) => (
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Quotation #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSalesOrders.length === 0 ? (
                  <TableEmptyRow colSpan={8} message="No sales orders found." />
                ) : (
                  visibleSalesOrders.map((order) => (
                    <TableRow key={order.SLNO}>
                      <TableCell className="font-medium">{order.SALES_ORDER_NUMBER}</TableCell>
                      <TableCell>#{order.QUOTATION_SLNO}</TableCell>
                      <TableCell>{order.CUSTOMER_NAME || 'N/A'}</TableCell>
                      <TableCell>
                        {`${order.VEHICLE_MAKE || ''} ${order.VEHICLE_MODEL || ''}`.trim() || 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(order.GRAND_TOTAL)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.STATUS}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.CREATED_DATE)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/sales-order/${order.SLNO}`)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Sales Order</DialogTitle>
            <DialogDescription>
              Create a provisional sales order from an existing quotation.
            </DialogDescription>
          </DialogHeader>
          {selectedQuotationNumber && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Quotation: </span>
              <span className="font-medium">{selectedQuotationNumber}</span>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="quotationSlno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quotation *</FormLabel>
                    <Select
                      value={field.value > 0 ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number.parseInt(value, 10) || 0)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isLoadingQuotations
                                ? 'Loading quotations...'
                                : 'Select a quotation'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shouldRenderSelectedQuotationOption && (
                          <SelectItem value={String(selectedQuotationId)}>
                            {selectedQuotationOptionLabel}
                          </SelectItem>
                        )}
                        {availableQuotations.length === 0 ? (
                          <SelectItem value="no-quotations" disabled>
                            {isLoadingQuotations ? 'Loading quotations...' : 'No quotations available'}
                          </SelectItem>
                        ) : (
                          availableQuotations.map((quotation) => (
                            <SelectItem
                              key={quotation.SLNO}
                              value={String(quotation.SLNO)}
                            >
                              {`${quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER} - ${quotation.CUSTOMER_NAME || 'No customer'}${quotation.VERSION > 1 ? ` (V${quotation.VERSION})` : ''}`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Optional notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
