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
  const quotation = salesOrder.quotation;
  const enquiry = salesOrder.enquiry;
  const lineItems = salesOrder.lineItems || [];
  const financingSchemes = salesOrder.financingSchemes || [];

  const formatOptionalCurrency = (value: unknown) => {
    if (value === undefined || value === null || value === '') return 'N/A';
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? String(value) : formatCurrency(numericValue);
  };

  const toNumber = (value: unknown) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  };

  const lineItemsDiscountTotal = lineItems.reduce(
    (sum, item) => sum + toNumber(item.DISCOUNT_AMOUNT),
    0
  );
  const lineItemsNetTotal = lineItems.reduce(
    (sum, item) => sum + toNumber(item.NET_PRICE),
    0
  );
  const chargePrice = toNumber(enquiry?.CHARGEPRICE);
  const vehicleBasePrice = toNumber(quotation?.VEHICLE_BASE_PRICE);
  const rawVehicleDiscount = toNumber(quotation?.VEHICLE_DISCOUNT);
  const effectiveVehicleDiscount =
    rawVehicleDiscount !== 0 ? rawVehicleDiscount : lineItemsDiscountTotal;
  const effectiveLineItemDiscounts =
    lineItemsDiscountTotal !== 0 && lineItemsDiscountTotal !== effectiveVehicleDiscount
      ? lineItemsDiscountTotal
      : null;
  const vehicleNetPrice =
    toNumber(quotation?.VEHICLE_NET_PRICE) ||
    Math.max(0, vehicleBasePrice + effectiveVehicleDiscount);
  const accessoriesTotal = toNumber(quotation?.ACCESSORIES_TOTAL);
  const accessoriesDiscount = toNumber(quotation?.ACCESSORIES_DISCOUNT);
  const accessoriesNetTotal =
    toNumber(quotation?.ACCESSORIES_NET_TOTAL) ||
    Math.max(0, accessoriesTotal + accessoriesDiscount);
  const warrantyTotal = toNumber(quotation?.WARRANTY_TOTAL);
  const insuranceTotal = toNumber(quotation?.INSURANCE_TOTAL);
  const subtotal =
    toNumber(quotation?.SUBTOTAL) ||
    lineItemsNetTotal + accessoriesNetTotal + warrantyTotal + insuranceTotal + chargePrice;
  const taxAmount = toNumber(quotation?.TAX_AMOUNT);
  const tradeInValue = toNumber(quotation?.TRADE_IN_VALUE);
  const downpayment = toNumber(quotation?.DOWNPAYMENT);
  const requestedDeposit = toNumber(quotation?.DEPOSIT_AMOUNT);
  const totalDiscountApplied =
    toNumber(quotation?.TOTAL_DISCOUNT_AMOUNT) ||
    (lineItemsDiscountTotal !== 0 ? lineItemsDiscountTotal : effectiveVehicleDiscount) +
      accessoriesDiscount;
  const grandTotal = toNumber(quotation?.GRAND_TOTAL) || toNumber(salesOrder.GRAND_TOTAL);
  const netAmountDue =
    toNumber(quotation?.NET_AMOUNT_DUE) ||
    Math.max(0, grandTotal - tradeInValue - downpayment);
  const depositCollected = String(quotation?.DEPOSIT_COLLECTED || '').trim() === 'Y';
  const remainingAfterDeposit = Math.max(0, netAmountDue - requestedDeposit);

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
            <p className="font-medium">Customer ID:</p>
            <p className="text-gray-700">{enquiry?.CUSTOMERID || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Address:</p>
            <p className="text-gray-700">
              {quotation?.CUSTOMER_ADDRESS || enquiry?.ADDRESS || 'N/A'}
            </p>
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
          <div>
            <p className="font-medium">Year:</p>
            <p className="text-gray-700">{quotation?.VEHICLE_YEAR || enquiry?.YEAR || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Color:</p>
            <p className="text-gray-700">{quotation?.VEHICLE_COLOR || enquiry?.COLOR || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Model Code:</p>
            <p className="text-gray-700">{enquiry?.MODELCODE || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Supp Cat Num:</p>
            <p className="text-gray-700">{enquiry?.SUPPCATNUM || 'N/A'}</p>
          </div>
        </div>
      </div>

      <Separator className="my-6 print:border-gray-300" />

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Pricing Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Vehicle Base Price:</p>
            <p className="text-gray-700">{formatOptionalCurrency(vehicleBasePrice)}</p>
          </div>
          <div>
            <p className="font-medium">Vehicle Discount:</p>
            <p className="text-gray-700">{formatOptionalCurrency(effectiveVehicleDiscount)}</p>
          </div>
          <div>
            <p className="font-medium">Vehicle Net Price:</p>
            <p className="text-gray-700">{formatOptionalCurrency(vehicleNetPrice)}</p>
          </div>
          <div>
            <p className="font-medium">Accessories Total:</p>
            <p className="text-gray-700">{formatOptionalCurrency(accessoriesTotal)}</p>
          </div>
          <div>
            <p className="font-medium">Accessories Discount:</p>
            <p className="text-gray-700">{formatOptionalCurrency(accessoriesDiscount)}</p>
          </div>
          <div>
            <p className="font-medium">Accessories Net Total:</p>
            <p className="text-gray-700">{formatOptionalCurrency(accessoriesNetTotal)}</p>
          </div>
          {effectiveLineItemDiscounts !== null && (
            <div>
              <p className="font-medium">Line Item Discounts:</p>
              <p className="text-gray-700">{formatOptionalCurrency(effectiveLineItemDiscounts)}</p>
            </div>
          )}
          <div>
            <p className="font-medium">Total Discount Applied:</p>
            <p className="text-gray-700">{formatOptionalCurrency(totalDiscountApplied)}</p>
          </div>
          <div>
            <p className="font-medium">Tax Amount:</p>
            <p className="text-gray-700">{formatOptionalCurrency(taxAmount)}</p>
          </div>
          <div>
            <p className="font-medium">Trade-In Value:</p>
            <p className="text-gray-700">{formatOptionalCurrency(tradeInValue)}</p>
          </div>
          <div>
            <p className="font-medium">Downpayment:</p>
            <p className="text-gray-700">{formatOptionalCurrency(downpayment)}</p>
          </div>
          <div>
            <p className="font-medium">Deposit Requested / Applied:</p>
            <p className="text-gray-700">{formatOptionalCurrency(requestedDeposit)}</p>
          </div>
          <div>
            <p className="font-medium">Deposit Status:</p>
            <p className="text-gray-700">{depositCollected ? 'Collected' : 'Not Collected'}</p>
          </div>
          <div>
            <p className="font-medium">Net Amount Due:</p>
            <p className="text-gray-700">{formatOptionalCurrency(netAmountDue)}</p>
          </div>
          <div>
            <p className="font-medium">Remaining After Deposit:</p>
            <p className="text-gray-700">{formatOptionalCurrency(remainingAfterDeposit)}</p>
          </div>
          <div>
            <p className="font-medium">Subtotal:</p>
            <p className="text-gray-700">{formatOptionalCurrency(subtotal)}</p>
          </div>
          <div className="col-span-2 mt-2 flex justify-between text-lg font-bold">
            <span>Grand Total:</span>
            <span>{formatOptionalCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {lineItems.length > 0 && (
        <>
          <Separator className="my-6 print:border-gray-300" />
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold">Line Items</h2>
            <div className="space-y-3 text-sm">
              {lineItems.map((item) => (
                <div
                  key={item.SLNO || `${item.LINE_NUMBER}-${item.ITEM_CODE || item.ITEM_DESCRIPTION}`}
                  className="rounded border border-gray-300 p-3"
                >
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <p className="font-medium">Line</p>
                      <p className="text-gray-700">{item.LINE_NUMBER || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Item</p>
                      <p className="text-gray-700">{item.ITEM_CODE || item.ITEM_TYPE || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="font-medium">Description</p>
                      <p className="text-gray-700">{item.ITEM_DESCRIPTION || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Qty</p>
                      <p className="text-gray-700">{item.QUANTITY ?? 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Unit Price</p>
                      <p className="text-gray-700">{formatOptionalCurrency(item.UNIT_PRICE)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Discount</p>
                      <p className="text-gray-700">
                        {formatOptionalCurrency(item.DISCOUNT_AMOUNT)}
                        {item.DISCOUNT_PERCENTAGE !== undefined &&
                        item.DISCOUNT_PERCENTAGE !== null
                          ? ` (${item.DISCOUNT_PERCENTAGE}%)`
                          : ''}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Net Price</p>
                      <p className="text-gray-700">{formatOptionalCurrency(item.NET_PRICE)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {(enquiry?.CHARGENAME || enquiry?.CHARGECODE || enquiry?.CHARGEPRICE) && (
        <>
          <Separator className="my-6 print:border-gray-300" />
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold">Charge Details</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Charge Code</p>
                <p className="text-gray-700">{enquiry?.CHARGECODE || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Charge Name</p>
                <p className="text-gray-700">{enquiry?.CHARGENAME || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Charge Price</p>
                <p className="text-gray-700">{formatOptionalCurrency(enquiry?.CHARGEPRICE)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {financingSchemes.length > 0 && (
        <>
          <Separator className="my-6 print:border-gray-300" />
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-bold">Financing Schemes</h2>
            <div className="space-y-3 text-sm">
              {financingSchemes.map((scheme) => (
                <div key={scheme.SLNO} className="rounded border border-gray-300 p-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <p className="font-medium">Lender</p>
                      <p className="text-gray-700">{scheme.LENDER_NAME || scheme.LENDER_CODE || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Currency</p>
                      <p className="text-gray-700">{scheme.CURRENCY || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Term</p>
                      <p className="text-gray-700">
                        {scheme.TERM_MONTHS ? `${scheme.TERM_MONTHS} months` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Sale Code</p>
                      <p className="text-gray-700">{scheme.SALE_CODE || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Finance Amount</p>
                      <p className="text-gray-700">{formatOptionalCurrency(scheme.FINANCE_AMOUNT)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Monthly Payment</p>
                      <p className="text-gray-700">{formatOptionalCurrency(scheme.MONTHLY_PAYMENT)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Interest Rate</p>
                      <p className="text-gray-700">
                        {scheme.INTEREST_RATE !== undefined && scheme.INTEREST_RATE !== null
                          ? `${scheme.INTEREST_RATE}%`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-gray-700">{scheme.STATUS || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
