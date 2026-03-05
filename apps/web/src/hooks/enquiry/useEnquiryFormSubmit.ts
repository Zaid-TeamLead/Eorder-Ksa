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
function transformEnquiryFormData(
  data: SalesEnquiryFormSubmission
): CreateEnquiryData {
  return {
    customerId: data.customerId,
    customerName: data.customerName,
    address: data.address,
    postcode: data.postcode,
    homePhone: data.homePhone,
    workPhone: data.workPhone,
    mobile: data.mobile,
    homeEmail: data.homeEmail,
    make: data.make,
    model: data.model,
    variant: data.variant,
    year: data.year,
    color: data.color,
    suppCatNum: data.suppCatNum,
    modelCode: data.modelCode,
    quantity: data.quantity,
    vinNumber: data.vinNumber,
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
