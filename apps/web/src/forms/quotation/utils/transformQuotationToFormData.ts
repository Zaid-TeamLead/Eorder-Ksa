import type { QuotationWithLineItems } from '@/types/quotation';
import type { QuotationFormData, LineItemFormData } from '../schema';

/**
 * Transforms API quotation data (UPPERCASE fields) to form data (camelCase)
 * Handles null/undefined values with proper defaults
 *
 * @param quotation - Quotation data from API
 * @returns Form-ready quotation data with all fields properly defaulted
 */
export function transformQuotationToFormData(
  quotation: QuotationWithLineItems
): QuotationFormData {
  return {
    // Required field
    enquirySlno: quotation.ENQUIRY_SLNO,

    // Customer Information
    customerName: quotation.CUSTOMER_NAME ?? '',
    customerMobile: quotation.CUSTOMER_MOBILE ?? '',
    customerEmail: quotation.CUSTOMER_EMAIL ?? '',
    customerAddress: quotation.CUSTOMER_ADDRESS ?? '',

    // Vehicle Information
    vehicleMake: quotation.VEHICLE_MAKE ?? '',
    vehicleModel: quotation.VEHICLE_MODEL ?? '',
    vehicleVariant: quotation.VEHICLE_VARIANT ?? '',
    vehicleYear: quotation.VEHICLE_YEAR ?? '',
    vehicleColor: quotation.VEHICLE_COLOR ?? '',
    vinNumber: quotation.VIN_NUMBER ?? '',

    // Vehicle Pricing
    vehicleBasePrice: quotation.VEHICLE_BASE_PRICE ?? 0,
    vehicleDiscount: quotation.VEHICLE_DISCOUNT ?? 0,
    vehicleNetPrice: quotation.VEHICLE_NET_PRICE ?? 0,

    // Accessories Pricing
    accessoriesTotal: quotation.ACCESSORIES_TOTAL ?? 0,
    accessoriesDiscount: quotation.ACCESSORIES_DISCOUNT ?? 0,
    accessoriesNetTotal: quotation.ACCESSORIES_NET_TOTAL ?? 0,

    // Other Components
    warrantyTotal: quotation.WARRANTY_TOTAL ?? 0,
    insuranceTotal: quotation.INSURANCE_TOTAL ?? 0,

    // Line Items - transform each item
    lineItems: quotation.lineItems?.map(transformLineItemToFormData) ?? [],

    // Total Calculations
    subtotal: quotation.SUBTOTAL ?? 0,
    taxRate: quotation.TAX_RATE ?? 15,
    taxAmount: quotation.TAX_AMOUNT ?? 0,
    grandTotal: quotation.GRAND_TOTAL ?? 0,

    // Trade-in & Financing
    tradeInValue: quotation.TRADE_IN_VALUE ?? 0,
    tradeInAppraisalSlno: quotation.TRADE_IN_APPRAISAL_SLNO ?? undefined,
    financingSchemeSlno: quotation.FINANCING_SCHEME_SLNO ?? undefined,
    downpayment: quotation.DOWNPAYMENT ?? 0,
    netAmountDue: quotation.NET_AMOUNT_DUE ?? 0,

    // Discount Summary
    totalDiscountAmount: quotation.TOTAL_DISCOUNT_AMOUNT ?? 0,
    discountPercentage: quotation.DISCOUNT_PERCENTAGE ?? 0,

    // Quotation Details
    validUntil: quotation.VALID_UNTIL ?? '',
    notes: quotation.NOTES ?? '',
    termsAndConditions: quotation.TERMS_AND_CONDITIONS ?? '',
    internalNotes: quotation.INTERNAL_NOTES ?? '',
  };
}

/**
 * Transforms API line item data to form data
 *
 * @param item - Line item from API
 * @param index - Item index (used as fallback for line number)
 * @returns Form-ready line item data
 */
function transformLineItemToFormData(
  item: QuotationWithLineItems['lineItems'][0],
  index: number
): LineItemFormData {
  return {
    lineNumber: item.LINE_NUMBER ?? index + 1,
    itemType: item.ITEM_TYPE,
    itemCode: item.ITEM_CODE ?? '',
    itemDescription: item.ITEM_DESCRIPTION ?? '',
    itemCategory: item.ITEM_CATEGORY ?? '',
    quantity: item.QUANTITY ?? 1,
    unitPrice: item.UNIT_PRICE ?? 0,
    discountAmount: item.DISCOUNT_AMOUNT ?? 0,
    discountPercentage: item.DISCOUNT_PERCENTAGE ?? 0,
    netPrice: item.NET_PRICE ?? 0,
    taxIncluded: item.TAX_INCLUDED ?? 'N',
    manufacturer: item.MANUFACTURER ?? '',
    partNumber: item.PART_NUMBER ?? '',
    warrantyPeriod: item.WARRANTY_PERIOD ?? '',
    notes: item.NOTES ?? '',
  };
}

/**
 * Development-only helper to check for NaN values in form data
 * Only runs in development mode
 *
 * @param data - Form data to validate
 */
export function validateFormDataForNaN(data: Record<string, any>): void {
  if (process.env.NODE_ENV !== 'development') return;

  const checkForNaN = (obj: any, path = ''): void => {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === 'number' && isNaN(value)) {
        console.error(`❌ NaN found at: ${currentPath}`);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          checkForNaN(item, `${currentPath}[${index}]`);
        });
      } else if (value && typeof value === 'object') {
        checkForNaN(value, currentPath);
      }
    });
  };

  checkForNaN(data);
}
