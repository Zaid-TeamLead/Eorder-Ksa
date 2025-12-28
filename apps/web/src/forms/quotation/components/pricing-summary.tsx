'use client';

import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { QuotationFormData } from '../schema';
import { formatCurrency } from '@/lib/formatters';
import { usePricingCalculations } from '@/hooks/quotation/usePricingCalculations';

export function PricingSummary() {
  const form = useFormContext<QuotationFormData>();

  // Watch all relevant fields for real-time calculations
  const lineItems = useWatch({ control: form.control, name: 'lineItems' });
  const vehicleBasePrice = useWatch({ control: form.control, name: 'vehicleBasePrice' });
  const vehicleDiscount = useWatch({ control: form.control, name: 'vehicleDiscount' });
  const warrantyTotal = useWatch({ control: form.control, name: 'warrantyTotal' });
  const insuranceTotal = useWatch({ control: form.control, name: 'insuranceTotal' });
  const taxRate = useWatch({ control: form.control, name: 'taxRate' });
  const tradeInValue = useWatch({ control: form.control, name: 'tradeInValue' });
  const downpayment = useWatch({ control: form.control, name: 'downpayment' });

  // Calculate all pricing values using the custom hook
  const {
    vehicleNetPrice,
    accessoriesTotal,
    accessoriesDiscount,
    accessoriesNetTotal,
    subtotal,
    taxAmount,
    grandTotal,
    netAmountDue,
    totalDiscountAmount,
    discountPercentage,
  } = usePricingCalculations({
    vehicleBasePrice: vehicleBasePrice || 0,
    vehicleDiscount: vehicleDiscount || 0,
    warrantyTotal: warrantyTotal || 0,
    insuranceTotal: insuranceTotal || 0,
    taxRate: taxRate || 15,
    tradeInValue: tradeInValue || 0,
    downpayment: downpayment || 0,
    lineItems: lineItems || [],
  });

  // Sync calculated values back to form
  useEffect(() => {
    form.setValue('vehicleNetPrice', vehicleNetPrice);
    form.setValue('accessoriesTotal', accessoriesTotal);
    form.setValue('accessoriesDiscount', accessoriesDiscount);
    form.setValue('accessoriesNetTotal', accessoriesNetTotal);
    form.setValue('subtotal', subtotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('grandTotal', grandTotal);
    form.setValue('netAmountDue', netAmountDue);
    form.setValue('totalDiscountAmount', totalDiscountAmount);
    form.setValue('discountPercentage', discountPercentage);
  }, [
    vehicleNetPrice,
    accessoriesTotal,
    accessoriesDiscount,
    accessoriesNetTotal,
    subtotal,
    taxAmount,
    grandTotal,
    netAmountDue,
    totalDiscountAmount,
    discountPercentage,
    form,
  ]);

  // Use calculated values for rendering
  const vehicleNet = vehicleNetPrice;
  const accessoriesNet = accessoriesNetTotal;
  const warranty = warrantyTotal || 0;
  const insurance = insuranceTotal || 0;
  const tax = taxAmount;
  const tradeIn = tradeInValue || 0;
  const down = downpayment || 0;
  const netDue = netAmountDue;
  const totalDiscount = totalDiscountAmount;
  const discountPct = discountPercentage;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pricing Summary</span>
          {totalDiscount < 0 && (
            <Badge variant="destructive">
              Total Discount: {discountPct.toFixed(2)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle Net Price:</span>
              <span className="font-medium">{formatCurrency(vehicleNet)}</span>
            </div>
            {accessoriesNet > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Accessories Net Total:</span>
                <span className="font-medium">{formatCurrency(accessoriesNet)}</span>
              </div>
            )}
            {warranty > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Warranty Total:</span>
                <span className="font-medium">{formatCurrency(warranty)}</span>
              </div>
            )}
            {insurance > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance Total:</span>
                <span className="font-medium">{formatCurrency(insurance)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Subtotal */}
          <div className="flex justify-between text-base font-semibold">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* Tax */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({taxRate || 15}%):</span>
            <span className="font-medium">{formatCurrency(tax)}</span>
          </div>

          <Separator />

          {/* Grand Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Grand Total:</span>
            <span className="text-primary">{formatCurrency(grandTotal)}</span>
          </div>

          {/* Deductions */}
          {(tradeIn > 0 || down > 0) && (
            <>
              <Separator className="my-3" />
              <div className="space-y-2 text-sm">
                {tradeIn > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Less: Trade-in Value:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(tradeIn)}
                    </span>
                  </div>
                )}
                {down > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Less: Downpayment:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(down)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Net Amount Due */}
              <div className="flex justify-between text-lg font-bold">
                <span>Net Amount Due:</span>
                <span className="text-primary">{formatCurrency(netDue)}</span>
              </div>
            </>
          )}

          {/* Discount Summary */}
          {totalDiscount < 0 && (
            <>
              <Separator className="my-3" />
              <div className="rounded-lg bg-muted p-3 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>Total Discount Applied:</span>
                  <span className="text-destructive">{formatCurrency(Math.abs(totalDiscount))}</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Discount Percentage:</span>
                  <span>{discountPct.toFixed(2)}%</span>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
