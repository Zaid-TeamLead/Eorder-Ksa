'use client';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { QuotationWithLineItems } from '@/types/quotation';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface QuotationPrintTemplateProps {
  quotation: QuotationWithLineItems;
}

export function QuotationPrintTemplate({ quotation }: QuotationPrintTemplateProps) {
  const displayQuotationNumber = quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER;
  const lineItemsSubtotal = (quotation.lineItems || []).reduce(
    (sum, item) => sum + Number(item.NET_PRICE || 0),
    0
  );
  const totalDiscountAmount = Number(quotation.TOTAL_DISCOUNT_AMOUNT || 0);
  const lineItemsDiscountAmount = (quotation.lineItems || []).reduce(
    (sum, item) => sum + Number(item.DISCOUNT_AMOUNT || 0),
    0
  );
  const effectiveDiscountAmount =
    totalDiscountAmount !== 0 ? totalDiscountAmount : lineItemsDiscountAmount;
  const effectiveDiscountPercentage = Number(quotation.DISCOUNT_PERCENTAGE || 0);
  const effectiveSubtotal =
    Number(quotation.SUBTOTAL || 0) !== 0
      ? Number(quotation.SUBTOTAL)
      : lineItemsSubtotal +
        Number(quotation.ACCESSORIES_NET_TOTAL || 0) +
        Number(quotation.WARRANTY_TOTAL || 0) +
        Number(quotation.INSURANCE_TOTAL || 0);
  const effectiveTaxAmount =
    Number(quotation.TAX_AMOUNT || 0) !== 0
      ? Number(quotation.TAX_AMOUNT)
      : Number((effectiveSubtotal * (Number(quotation.TAX_RATE || 0) / 100)).toFixed(2));
  const effectiveGrandTotal =
    Number(quotation.GRAND_TOTAL || 0) !== 0
      ? Number(quotation.GRAND_TOTAL)
      : Number((effectiveSubtotal + effectiveTaxAmount).toFixed(2));
  const effectiveNetAmountDue =
    Number(quotation.NET_AMOUNT_DUE || 0) !== 0
      ? Number(quotation.NET_AMOUNT_DUE)
      : Math.max(
          0,
          Number(
            (
              effectiveGrandTotal -
              Number(quotation.TRADE_IN_VALUE || 0) -
              Number(quotation.DOWNPAYMENT || 0)
            ).toFixed(2)
          )
        );

  return (
    <div className="print-content mx-auto max-w-[210mm] bg-white p-8 text-black">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">QUOTATION</h1>
          <p className="mt-2 text-sm text-gray-600">
            {displayQuotationNumber}
            {quotation.VERSION > 1 && (
              <Badge variant="outline" className="ml-2 print:border-black">
                Version {quotation.VERSION}
              </Badge>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Keyloop Pro</p>
          <p className="text-sm text-gray-600">Dealer Management System</p>
          <p className="mt-4 text-sm">
            <span className="font-medium">Date:</span> {formatDate(quotation.CREATED_DATE, { format: 'long' })}
          </p>
          {quotation.VALID_UNTIL && (
            <p className="text-sm">
              <span className="font-medium">Valid Until:</span> {quotation.VALID_UNTIL}
            </p>
          )}
        </div>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      {/* Customer Information */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Name:</p>
            <p className="text-gray-700">{quotation.CUSTOMER_NAME || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Mobile:</p>
            <p className="text-gray-700">{quotation.CUSTOMER_MOBILE || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Email:</p>
            <p className="text-gray-700">{quotation.CUSTOMER_EMAIL || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Address:</p>
            <p className="text-gray-700">{quotation.CUSTOMER_ADDRESS || 'N/A'}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      {/* Vehicle Details */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Vehicle Details</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium">Make:</p>
            <p className="text-gray-700">{quotation.VEHICLE_MAKE || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Model:</p>
            <p className="text-gray-700">{quotation.VEHICLE_MODEL || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Variant:</p>
            <p className="text-gray-700">{quotation.VEHICLE_VARIANT || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Year:</p>
            <p className="text-gray-700">{quotation.VEHICLE_YEAR || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Color:</p>
            <p className="text-gray-700">{quotation.VEHICLE_COLOR || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">VIN:</p>
            <p className="text-gray-700">{quotation.VIN_NUMBER || 'N/A'}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      {/* Line Items Table */}
      <div className="mb-6 no-page-break">
        <h2 className="mb-3 text-lg font-bold">Line Items</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-100 print:bg-gray-100">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Item Description</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Unit Price</th>
              <th className="p-2 text-right">Discount</th>
              <th className="p-2 text-right">Net Price</th>
            </tr>
          </thead>
          <tbody>
            {quotation.lineItems.map((item) => (
              <tr key={item.SLNO} className="border-b border-gray-200">
                <td className="p-2">{item.LINE_NUMBER}</td>
                <td className="p-2">
                  <div>
                    <span className="font-medium">{item.ITEM_DESCRIPTION}</span>
                    <span className="ml-2 text-xs text-gray-500">({item.ITEM_TYPE})</span>
                  </div>
                  {item.NOTES && <p className="text-xs text-gray-600">{item.NOTES}</p>}
                </td>
                <td className="p-2 text-right">{item.QUANTITY}</td>
                <td className="p-2 text-right">{formatCurrency(item.UNIT_PRICE)}</td>
                <td className="p-2 text-right text-red-600">{formatCurrency(item.DISCOUNT_AMOUNT)}</td>
                <td className="p-2 text-right font-medium">{formatCurrency(item.NET_PRICE)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      {/* Pricing Summary */}
      <div className="mb-6 flex justify-end">
        <div className="w-96 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Subtotal:</span>
            <span>{formatCurrency(effectiveSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">VAT ({quotation.TAX_RATE}%):</span>
            <span>{formatCurrency(effectiveTaxAmount)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total:</span>
            <span>{formatCurrency(effectiveGrandTotal)}</span>
          </div>

          {(quotation.TRADE_IN_VALUE > 0 || quotation.DOWNPAYMENT > 0) && (
            <>
              <Separator className="my-2" />
              {quotation.TRADE_IN_VALUE > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Less: Trade-in Value:</span>
                  <span>-{formatCurrency(quotation.TRADE_IN_VALUE)}</span>
                </div>
              )}
              {quotation.DOWNPAYMENT > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Less: Downpayment:</span>
                  <span>-{formatCurrency(quotation.DOWNPAYMENT)}</span>
                </div>
              )}
              <Separator className="my-2 print:border-gray-400" />
              <div className="flex justify-between text-lg font-bold">
                <span>Net Amount Due:</span>
                <span>{formatCurrency(effectiveNetAmountDue)}</span>
              </div>
            </>
          )}

          {effectiveDiscountAmount < 0 && (
            <div className="mt-4 rounded border border-gray-300 bg-gray-50 p-3 print:bg-gray-50">
              <div className="flex justify-between font-semibold">
                <span>Total Discount Applied:</span>
                <span className="text-red-600">
                  {formatCurrency(Math.abs(effectiveDiscountAmount))}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Discount Percentage:</span>
                <span>{effectiveDiscountPercentage.toFixed(2)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Conditions */}
      {quotation.TERMS_AND_CONDITIONS && (
        <>
          <Separator className="my-6 print:border-gray-300" />
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold">Terms & Conditions</h2>
            <div className="whitespace-pre-wrap text-sm text-gray-700">
              {quotation.TERMS_AND_CONDITIONS}
            </div>
          </div>
        </>
      )}

      {/* Notes */}
      {quotation.NOTES && (
        <>
          <Separator className="my-6 print:border-gray-300" />
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold">Notes</h2>
            <div className="whitespace-pre-wrap text-sm text-gray-700">{quotation.NOTES}</div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-12 border-t border-gray-300 pt-6 text-center text-xs text-gray-600">
        <p className="font-medium">Thank you for your business!</p>
        <p className="mt-2">
          This quotation is generated by Keyloop Pro Dealer Management System
        </p>
        {quotation.CREATED_BY && (
          <p className="mt-2">
            Prepared by: <span className="font-medium">{quotation.CREATED_BY}</span>
          </p>
        )}
      </div>
    </div>
  );
}
