import { useEnquiryMutations } from '../entities/useEnquiryMutations';
import type { SalesEnquiryFormSubmission } from '@/forms/sales-enquiry';
import type { SalesEnquiry } from '@/services/enquiry';
import { useFormSubmit } from '@/hooks/shared/useFormSubmit';
import type { CreateEnquiryData } from '@/types/enquiry';

export interface UseEnquiryFormSubmitParams {
  isEditMode: boolean;
  selectedEntity: SalesEnquiry | null;
  onSuccess?: () => void;
}

export interface UseEnquiryFormSubmitReturn {
  handleSubmit: (data: SalesEnquiryFormSubmission) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Transform form data to API payload format
 */
function extractVinFromUnknown(input: unknown): string {
  if (!input || typeof input !== 'object') return '';

  const record = input as Record<string, unknown>;
  const directKeys = [
    'VINNUMBER',
    'VIN',
    'vinNumber',
    'vin',
    'U_Veh_StockID',
    'u_veh_stockid',
  ];

  for (const key of directKeys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  const dynamicMatch = Object.entries(record).find(([key, value]) => {
    if (value === undefined || value === null) return false;
    if (String(value).trim() === '') return false;
    return key.toLowerCase().includes('vin');
  });

  return dynamicMatch ? String(dynamicMatch[1]).trim() : '';
}

function transformEnquiryFormData(
  data: SalesEnquiryFormSubmission
): CreateEnquiryData {
  const primaryCartItem = data.cartItems?.[0];
  const resolvedVinNumber =
    data.vinNumber ||
    extractVinFromUnknown(data.vinDetails) ||
    primaryCartItem?.vinNumber ||
    '';

  return {
    customerId: data.customerId,
    customerName: data.customerName,
    address: data.address,
    postcode: data.postcode,
    homePhone: data.homePhone,
    workPhone: data.workPhone,
    mobile: data.mobile,
    homeEmail: data.homeEmail,
    make: data.make || primaryCartItem?.make || '',
    model: data.model || primaryCartItem?.model || '',
    variant: data.variant || primaryCartItem?.variant || primaryCartItem?.itemCode || '',
    year: data.year || primaryCartItem?.year || '',
    color: data.color || primaryCartItem?.color || '',
    suppCatNum: data.suppCatNum,
    modelCode: data.modelCode,
    quantity: data.quantity || primaryCartItem?.quantity,
    vinNumber: resolvedVinNumber,
    vinDetails: data.vinDetails,
    branch: data.branch,
    budget: data.budget,
    financing: data.financing,
    preferredContact: data.preferredContact,
    preferredTime: data.preferredTime,
    preferredDelivery: data.preferredDelivery,
    source: data.source,
    salesType: data.sales_type,
    tradeInMake: data.tradeInMake,
    tradeInModel: data.tradeInModel,
    tradeInYear: data.tradeInYear,
    tradeInKms: data.tradeInKms,
    tradeInExpectedPrice: data.tradeInExpectedPrice,
    salesperson: data.salesperson,
    slpCode: data.slpCode,
    notes: data.notes,
  };
}

/**
 * Custom hook for handling enquiry form submission
 *
 * Handles both create and edit flows for sales enquiries.
 * Transforms form data to API payload format and manages success/error states.
 *
 * @example
 * ```tsx
 * const { handleSubmit, isSubmitting } = useEnquiryFormSubmit({
 *   isEditMode: modal.isEditMode,
 *   selectedEntity: modal.selectedEntity,
 *   onSuccess: () => {
 *     modal.close();
 *     setCurrentTab("customer-information");
 *   },
 * });
 * ```
 */
export function useEnquiryFormSubmit({
  isEditMode,
  selectedEntity,
  onSuccess,
}: UseEnquiryFormSubmitParams): UseEnquiryFormSubmitReturn {
  const { createEnquiry, updateEnquiry, isCreating, isUpdating } = useEnquiryMutations();

  return useFormSubmit({
    isEditMode,
    selectedEntity: selectedEntity ? { id: selectedEntity.SLNO } : null,
    createMutation: createEnquiry,
    updateMutation: updateEnquiry,
    transformData: transformEnquiryFormData,
    onSuccess,
    entityName: 'Enquiry',
    isCreating,
    isUpdating,
  });
}
