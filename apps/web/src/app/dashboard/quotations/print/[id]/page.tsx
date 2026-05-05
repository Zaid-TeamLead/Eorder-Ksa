'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuotationPrintTemplate } from '@/components/quotation/print-template';
import { useQuotationById } from '@/hooks/entities/useQuotations';
import { LoadingState } from '@/components/shared/loading-state';
import { buildSalesReportUrl } from '@/lib/sales-report';

interface PrintQuotationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PrintQuotationPage({ params }: PrintQuotationPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const quotationId = parseInt(resolvedParams.id);

  const { quotation, isLoading, error } = useQuotationById(quotationId);

  const handlePrint = () => {
    if (quotation?.SAPDOCENTRY?.trim()) {
      window.open(
        buildSalesReportUrl({
          referenceNumber: quotation.SAPDOCENTRY,
          type: 'SalesQuote',
        }),
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    window.print();
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingState message="Loading quotation..." />;
  }

  if (error || !quotation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Quotation</h2>
          <p className="mt-2 text-muted-foreground">
            {error?.message || 'Quotation not found'}
          </p>
          <Button onClick={handleBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar (hidden when printing) */}
      <div className="print-hidden sticky top-0 z-10 border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between">
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER}
              {quotation.VERSION > 1 && ` (Version ${quotation.VERSION})`}
            </span>
          </div>

          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Quotation
          </Button>
        </div>
      </div>

      {/* Print Content */}
      <div className="py-8">
        <QuotationPrintTemplate quotation={quotation} />
      </div>

      {/* Footer (hidden when printing) */}
      <div className="print-hidden border-t bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between text-sm text-muted-foreground">
          <p>Use the print button above or press Ctrl+P (Cmd+P on Mac) to print</p>
          <p>
            Status: <span className="font-medium">{quotation.STATUS}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
