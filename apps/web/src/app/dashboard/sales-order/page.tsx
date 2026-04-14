'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Eye } from 'lucide-react';
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
import { formatCurrency, formatDate } from '@/lib/formatters';

const createSalesOrderSchema = z.object({
  quotationSlno: z.coerce.number().int().positive('Valid quotation ID is required'),
  notes: z.string().max(5000).optional(),
});

type CreateSalesOrderFormData = z.infer<typeof createSalesOrderSchema>;

export default function SalesOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationIdParam = searchParams.get('quotationId');
  const hasConsumedQuotationParam = useRef(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { salesOrders, isLoading, error, refetch } = useSalesOrders();
  const { quotations, isLoading: isLoadingQuotations } = useQuotations();
  const { createFromQuotation, isCreating } = useSalesOrderMutations();

  const usedQuotationIds = new Set(
    salesOrders
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
    await createFromQuotation(data);
    setCreateDialogOpen(false);
    form.reset({ quotationSlno: 0, notes: '' });
    await refetch();
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
                {salesOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No sales orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesOrders.map((order) => (
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
                        {availableQuotations.length === 0 ? (
                          <SelectItem value="no-quotations" disabled>
                            No quotations available
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
