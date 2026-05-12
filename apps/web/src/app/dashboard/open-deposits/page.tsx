'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, CircleDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOpenDeposits } from '@/hooks/entities/useQuotations';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { AllocateDepositDialog } from '@/components/quotation/allocate-deposit-dialog';
import type { Quotation } from '@/types/quotation';

export default function OpenDepositsPage() {
  const router = useRouter();
  const { deposits, isLoading, error, refetch } = useOpenDeposits();
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);

  const pendingDeposits = useMemo(
    () => deposits.filter((q) => q.PASSED_TO_CASHIER === 'Y' && q.DEPOSIT_COLLECTED !== 'Y'),
    [deposits]
  );

  if (isLoading) {
    return <LoadingState message="Loading open deposits..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Error Loading Open Deposits"
        message={error.message || 'Failed to load open deposits'}
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
          <CardTitle>Open Deposits Received</CardTitle>
          <CardDescription>
            Quotations passed to cashier with deposits pending allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDeposits.length === 0 ? (
            <EmptyState title="No open deposits found." className="py-10" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Deposit Amount</TableHead>
                    <TableHead>Passed Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDeposits.map((quotation) => (
                    <TableRow key={quotation.SLNO}>
                      <TableCell className="font-medium">{quotation.QUOTATION_NUMBER}</TableCell>
                      <TableCell>{quotation.CUSTOMER_NAME || 'N/A'}</TableCell>
                      <TableCell>{`${quotation.VEHICLE_MAKE || ''} ${quotation.VEHICLE_MODEL || ''}`.trim() || 'N/A'}</TableCell>
                      <TableCell>{quotation.PASSED_TO_CASHIER_BY || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(Number(quotation.DEPOSIT_AMOUNT || 0))}</TableCell>
                      <TableCell>
                        {quotation.PASSED_TO_CASHIER_DATE
                          ? formatDate(quotation.PASSED_TO_CASHIER_DATE, { includeTime: true })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/quotations/${quotation.SLNO}`)}
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedQuotation(quotation);
                              setAllocateDialogOpen(true);
                            }}
                          >
                            <CircleDollarSign className="mr-2 h-3.5 w-3.5" />
                            Allocate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedQuotation && (
        <AllocateDepositDialog
          open={allocateDialogOpen}
          onOpenChange={(open) => {
            setAllocateDialogOpen(open);
            if (!open) {
              setSelectedQuotation(null);
            }
          }}
          quotationId={selectedQuotation.SLNO}
          defaultAmount={Number(selectedQuotation.DEPOSIT_AMOUNT || 0)}
          onSuccess={() => {
            setAllocateDialogOpen(false);
            setSelectedQuotation(null);
            void refetch();
          }}
        />
      )}
    </div>
  );
}
