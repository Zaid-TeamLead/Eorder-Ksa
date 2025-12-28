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
    // Calculate vehicle net price
    const vehicleNetPrice = Math.max(0, vehicleBasePrice + vehicleDiscount); // discount is negative

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
    const totalDiscountAmount = vehicleDiscount + accessoriesDiscountTotal;

    // Calculate discount percentage
    const discountPercentage =
      subtotal > 0
        ? parseFloat(((Math.abs(totalDiscountAmount) / subtotal) * 100).toFixed(2))
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
