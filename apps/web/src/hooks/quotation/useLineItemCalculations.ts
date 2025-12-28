/**
 * Custom hook for line item calculations
 *
 * Provides pure calculation functions for line item pricing:
 * - Calculate net price from quantity, unit price, and discount
 * - Calculate discount percentage from discount amount
 * - Calculate discount amount from discount percentage
 *
 * @example
 * ```tsx
 * const { calculateNetPrice, calculateDiscountPercentage, calculateDiscountAmount } = useLineItemCalculations();
 *
 * const netPrice = calculateNetPrice(2, 100, -10); // 190
 * const discountPct = calculateDiscountPercentage(2, 100, -10); // 5
 * const discountAmt = calculateDiscountAmount(2, 100, 5); // -10
 * ```
 */
export function useLineItemCalculations() {
  /**
   * Calculate net price from quantity, unit price, and discount amount
   * @param quantity - Quantity of items
   * @param unitPrice - Price per unit
   * @param discountAmount - Discount amount (negative value)
   * @returns Net price (never negative)
   */
  const calculateNetPrice = (
    quantity: number,
    unitPrice: number,
    discountAmount: number
  ): number => {
    const netPrice = quantity * unitPrice + discountAmount; // discountAmount is negative
    return Math.max(0, netPrice);
  };

  /**
   * Calculate discount percentage from quantity, unit price, and discount amount
   * @param quantity - Quantity of items
   * @param unitPrice - Price per unit
   * @param discountAmount - Discount amount (negative value)
   * @returns Discount percentage (0-100)
   */
  const calculateDiscountPercentage = (
    quantity: number,
    unitPrice: number,
    discountAmount: number
  ): number => {
    const basePrice = quantity * unitPrice;
    if (basePrice > 0) {
      const percentage = (Math.abs(discountAmount) / basePrice) * 100;
      return parseFloat(percentage.toFixed(2));
    }
    return 0;
  };

  /**
   * Calculate discount amount from quantity, unit price, and discount percentage
   * @param quantity - Quantity of items
   * @param unitPrice - Price per unit
   * @param discountPercentage - Discount percentage (0-100)
   * @returns Discount amount (negative value)
   */
  const calculateDiscountAmount = (
    quantity: number,
    unitPrice: number,
    discountPercentage: number
  ): number => {
    const basePrice = quantity * unitPrice;
    const amount = -(basePrice * (discountPercentage / 100));
    return parseFloat(amount.toFixed(2));
  };

  return {
    calculateNetPrice,
    calculateDiscountPercentage,
    calculateDiscountAmount,
  };
}
