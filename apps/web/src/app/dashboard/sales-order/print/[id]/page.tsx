'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useSalesOrderById } from '@/hooks/entities/useSalesOrders';
import { SalesOrderPrintTemplate } from '@/components/sales-order/print-template';
import { buildSalesReportUrl } from '@/lib/sales-report';

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

  const getSalesOrderReportReference = () =>
    salesOrder?.SAPDOCENTRY?.trim() ||
    salesOrder?.SAPDOCNUM?.trim() ||
    salesOrder?.SAPREFENTRY?.trim() ||
    salesOrder?.quotation?.SAPREFENTRY?.trim() ||
    '';

  const handlePrint = () => {
    const reportReference = getSalesOrderReportReference();

    if (reportReference) {
      window.open(
        buildSalesReportUrl({
          referenceNumber: reportReference,
          type: 'SalesOrder',
        }),
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    window.print();
  };

  if (isLoading) {
    return <LoadingState message="Loading sales order..." />;
  }

  if (error || !salesOrder) {
    return (
      <ErrorState
        title="Error Loading Sales Order"
        message={error?.message || 'Sales order not found'}
        onRetry={() => router.back()}
        actionLabel="Go Back"
        ActionIcon={ArrowLeft}
      />
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

          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Sales Order
          </Button>
        </div>
      </div>

      <div className="py-8">
        <SalesOrderPrintTemplate salesOrder={salesOrder} />
      </div>
    </div>
  );
}
