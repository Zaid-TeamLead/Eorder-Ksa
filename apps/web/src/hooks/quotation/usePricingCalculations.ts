import { useMemo } from 'react';
import type { LineItemFormData } from '@/forms/quotation/schema';

export interface UsePricingCalculationsParams {
  vehicleBasePrice: number;
  vehicleDiscount: number;
  warrantyTotal: number;
  insuranceTotal: number;
  taxRate: number;
  tradeInValue: number;
  downpayment: number;
  lineItems: LineItemFormData[];
}

export interface UsePricingCalculationsReturn {
  vehicleNetPrice: number;
  accessoriesTotal: number;
  accessoriesDiscount: number;
  accessoriesNetTotal: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  netAmountDue: number;
  totalDiscountAmount: number;
  discountPercentage: number;
}

/**
 * Custom hook for quotation pricing calculations
 *
 * Calculates all pricing-related values for a quotation including:
 * - Vehicle net price (base price + discount)
 * - Accessories totals and discounts
 * - Subtotal, tax, grand total
 * - Net amount due (after trade-in and downpayment)
 * - Total discount amount and percentage
 *
 * All calculations are memoized and recalculated only when input values change.
 *
 * @param vehicleBasePrice - Base price of the vehicle before discount
 * @param vehicleDiscount - Discount amount (negative value)
 * @param warrantyTotal - Total warranty cost
 * @param insuranceTotal - Total insurance cost
 * @param taxRate - Tax rate percentage (e.g., 15 for 15%)
 * @param tradeInValue - Trade-in value to deduct
 * @param downpayment - Downpayment amount to deduct
 * @param lineItems - Reserved for future use when accessories are tracked in line items
 *
 * @example
 * ```tsx
 * const {
 *   vehicleNetPrice,
 *   grandTotal,
 *   netAmountDue,
 *   discountPercentage
 * } = usePricingCalculations({
 *   vehicleBasePrice: 50000,
 *   vehicleDiscount: -2500,
 *   warrantyTotal: 1000,
 *   insuranceTotal: 500,
 *   taxRate: 15,
 *   tradeInValue: 10000,
 *   downpayment: 5000,
 *   lineItems: []
 * });
 * ```
 */
export function usePricingCalculations({
  vehicleBasePrice,
  vehicleDiscount,
  warrantyTotal,
  insuranceTotal,
  taxRate,
  tradeInValue,
  downpayment,
  lineItems,
}: UsePricingCalculationsParams): UsePricingCalculationsReturn {
  return useMemo(() => {
    const lineItemsTotals = (lineItems || []).reduce(
      (acc, item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const discountAmount = Number(item.discountAmount || 0);
        const netPrice = Number(item.netPrice || 0);

        acc.basePrice += quantity * unitPrice;
        acc.discount += discountAmount;
        acc.netPrice += netPrice;
        return acc;
      },
      { basePrice: 0, discount: 0, netPrice: 0 }
    );

    const hasLineItemPricing = lineItemsTotals.basePrice > 0 || lineItemsTotals.netPrice > 0;

    const effectiveVehicleBasePrice = hasLineItemPricing
      ? lineItemsTotals.basePrice
      : vehicleBasePrice;
    const effectiveVehicleDiscount = hasLineItemPricing
      ? lineItemsTotals.discount
      : vehicleDiscount;

    // Calculate vehicle net price
    const vehicleNetPrice = hasLineItemPricing
      ? Math.max(0, lineItemsTotals.netPrice)
      : Math.max(0, vehicleBasePrice + vehicleDiscount); // discount is negative

    // Calculate accessories total and discount from line items
    // Note: In the current implementation, accessories are not calculated from line items
    // This is a placeholder for future enhancement when accessories are tracked separately
    const accessoriesGross = 0;
    const accessoriesDiscountTotal = 0;
    const accessoriesNetTotal = accessoriesGross + accessoriesDiscountTotal;

    // Calculate subtotal
    const subtotal = Math.max(
      0,
      vehicleNetPrice +
        accessoriesNetTotal +
        warrantyTotal +
        insuranceTotal
    );

    // Calculate tax
    const taxAmount = subtotal * (taxRate / 100);

    // Calculate grand total
    const grandTotal = subtotal + taxAmount;

    // Calculate net amount due
    const netAmountDue = Math.max(0, grandTotal - tradeInValue - downpayment);

    // Calculate total discount
    const totalDiscountAmount = effectiveVehicleDiscount + accessoriesDiscountTotal;

    // Calculate discount percentage
    const discountPercentage =
      effectiveVehicleBasePrice > 0
        ? parseFloat(
            ((Math.abs(totalDiscountAmount) / effectiveVehicleBasePrice) * 100).toFixed(2)
          )
        : 0;

    return {
      vehicleNetPrice,
      accessoriesTotal: accessoriesGross,
      accessoriesDiscount: accessoriesDiscountTotal,
      accessoriesNetTotal,
      subtotal,
      taxAmount,
      grandTotal,
      netAmountDue,
      totalDiscountAmount,
      discountPercentage,
    };
  }, [
    vehicleBasePrice,
    vehicleDiscount,
    warrantyTotal,
    insuranceTotal,
    taxRate,
    tradeInValue,
    downpayment,
    lineItems,
  ]);
}
