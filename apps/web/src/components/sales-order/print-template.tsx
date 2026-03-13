'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { SalesOrder } from '@/types/salesOrder';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface SalesOrderPrintTemplateProps {
  salesOrder: SalesOrder;
}

export function SalesOrderPrintTemplate({
  salesOrder,
}: SalesOrderPrintTemplateProps) {
  return (
    <div className="print-content mx-auto max-w-[210mm] bg-white p-8 text-black">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">SALES ORDER</h1>
          <p className="mt-2 text-sm text-gray-600">
            {salesOrder.SALES_ORDER_NUMBER}
            {salesOrder.VERSION > 1 && (
              <Badge variant="outline" className="ml-2 print:border-black">
                Version {salesOrder.VERSION}
              </Badge>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Keyloop Pro</p>
          <p className="text-sm text-gray-600">Dealer Management System</p>
          <p className="mt-4 text-sm">
            <span className="font-medium">Date:</span>{' '}
            {formatDate(salesOrder.CREATED_DATE, { format: 'long' })}
          </p>
        </div>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Name:</p>
            <p className="text-gray-700">{salesOrder.CUSTOMER_NAME || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Mobile:</p>
            <p className="text-gray-700">{salesOrder.CUSTOMER_MOBILE || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Email:</p>
            <p className="text-gray-700">{salesOrder.CUSTOMER_EMAIL || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Status:</p>
            <p className="text-gray-700">{salesOrder.STATUS}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Vehicle Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Make:</p>
            <p className="text-gray-700">{salesOrder.VEHICLE_MAKE || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Model:</p>
            <p className="text-gray-700">{salesOrder.VEHICLE_MODEL || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Variant:</p>
            <p className="text-gray-700">{salesOrder.VEHICLE_VARIANT || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">VIN:</p>
            <p className="text-gray-700">{salesOrder.VIN_NUMBER || 'N/A'}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      <div className="mb-6 flex justify-end">
        <div className="w-80 space-y-2 text-sm">
          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total:</span>
            <span>{formatCurrency(salesOrder.GRAND_TOTAL)}</span>
          </div>
        </div>
      </div>

      {salesOrder.NOTES && (
        <>
          <Separator className="my-6 print:border-gray-300" />
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold">Notes</h2>
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {salesOrder.NOTES}
            </div>
          </div>
        </>
      )}

      <div className="mt-12 border-t border-gray-300 pt-6 text-center text-xs text-gray-600">
        <p className="font-medium">Prepared by: {salesOrder.CREATED_BY}</p>
      </div>
    </div>
  );
}
