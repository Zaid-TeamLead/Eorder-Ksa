'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/loading-state';
import { useSalesOrderById } from '@/hooks/entities/useSalesOrders';
import { useSalesOrderMutations } from '@/hooks/entities/useSalesOrderMutations';
import { SalesOrderPrintTemplate } from '@/components/sales-order/print-template';

interface PrintSalesOrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PrintSalesOrderPage({ params }: PrintSalesOrderPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const salesOrderId = Number.parseInt(resolvedParams.id, 10);

  const { salesOrder, isLoading, error } = useSalesOrderById(salesOrderId);
  const { markAsPrinted, isPrinting } = useSalesOrderMutations();

  const handlePrint = async () => {
    await markAsPrinted(salesOrderId);
    window.print();
  };

  if (isLoading) {
    return <LoadingState message="Loading sales order..." />;
  }

  if (error || !salesOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Sales Order</h2>
          <p className="mt-2 text-muted-foreground">
            {error?.message || 'Sales order not found'}
          </p>
          <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="print-hidden sticky top-0 z-10 border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="text-sm text-muted-foreground">
            {salesOrder.SALES_ORDER_NUMBER}
          </div>

          <Button onClick={() => void handlePrint()} disabled={isPrinting}>
            <Printer className="mr-2 h-4 w-4" />
            {isPrinting ? 'Preparing...' : 'Print Sales Order'}
          </Button>
        </div>
      </div>

      <div className="py-8">
        <SalesOrderPrintTemplate salesOrder={salesOrder} />
      </div>
    </div>
  );
}
