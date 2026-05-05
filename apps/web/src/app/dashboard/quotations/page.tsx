'use client';

import { useState } from 'react';
import { Printer, Eye, Edit, Copy, Trash2, MoreHorizontal, CircleX } from 'lucide-react';
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
import { QuotationStatusBadge } from '@/components/quotation/status-badge';
import { CancelQuotationDialog } from '@/components/quotation/cancel-quotation-dialog';

// Custom hooks
import { useQuotationsTable } from '@/hooks/quotation/useQuotationsTable';
import { useQuotationActions } from '@/hooks/quotation/useQuotationActions';

export default function QuotationsPage() {
  const { quotations, isLoading, refetch } = useQuotations();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [quotationToCancel, setQuotationToCancel] = useState<{
    id: number;
    number: string;
  } | null>(null);

  // Use custom hooks for table filtering and actions
  const { filteredQuotations, statusFilter, setStatusFilter } = useQuotationsTable({
    quotations,
    initialFilter: 'all',
  });

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
          <div className="mb-6 flex items-center gap-4">
            <div className="w-64">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              {filteredQuotations.length} quotation{filteredQuotations.length !== 1 ? 's' : ''}
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
                {filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No quotations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((quotation) => (
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
