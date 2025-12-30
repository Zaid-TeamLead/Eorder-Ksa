import type { SalesEnquiryFormData } from '../../schema';

/**
 * Returns form values with only vehicle fields reset
 * Preserves customer, enquiry, and trade-in information
 *
 * Used when adding a vehicle to cart - allows user to add multiple vehicles
 * to the same enquiry without re-entering customer details
 *
 * @param currentData - Current form values
 * @returns Form values with vehicle fields reset, other fields preserved
 */
export function getVehicleFormResetValues(
  currentData: SalesEnquiryFormData
): SalesEnquiryFormData {
  return {
    // Preserve customer information
    customerId: currentData.customerId,
    customerName: currentData.customerName,
    address: currentData.address,
    postcode: currentData.postcode,
    homePhone: currentData.homePhone,
    workPhone: currentData.workPhone,
    mobile: currentData.mobile,
    homeEmail: currentData.homeEmail,

    // Reset vehicle details to empty
    make: '',
    model: '',
    variant: '',
    year: '',
    color: '',
    suppCatNum: '',
    modelCode: '',
    quantity: undefined,
    vinNumber: '',
    vinDetails: undefined,

    // Preserve enquiry details
    branch: currentData.branch,
    budget: currentData.budget,
    financing: currentData.financing,
    preferredContact: currentData.preferredContact,
    preferredTime: currentData.preferredTime,
    preferredDelivery: currentData.preferredDelivery,
    source: currentData.source,
    sales_type: currentData.sales_type,

    // Preserve trade-in vehicle information
    tradeInMake: currentData.tradeInMake,
    tradeInModel: currentData.tradeInModel,
    tradeInYear: currentData.tradeInYear,
    tradeInKms: currentData.tradeInKms,
    tradeInExpectedPrice: currentData.tradeInExpectedPrice,

    // Preserve additional information
    salesperson: currentData.salesperson,
    slpCode: currentData.slpCode,
    notes: currentData.notes,
  };
}
