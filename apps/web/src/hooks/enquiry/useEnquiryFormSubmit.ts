import { useCallback } from 'react';
import { toast } from 'sonner';
import { useEnquiryMutations } from '../entities/useEnquiryMutations';
import type { SalesEnquiryFormSubmission } from '@/forms/sales-enquiry';
import type { SalesEnquiry } from '@/services/enquiry';
import { logger } from '@/lib/logger';

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

  const handleSubmit = useCallback(
    async (data: SalesEnquiryFormSubmission) => {
      try {
        // Transform form data to API payload
        const payload = {
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

        if (isEditMode && selectedEntity) {
          // Edit existing enquiry
          await updateEnquiry(selectedEntity.SLNO, payload);
        } else {
          // Create new enquiry
          await createEnquiry(payload);
        }

        // Call success callback
        onSuccess?.();
      } catch (error) {
        logger.error('Error saving enquiry:', error);
        toast.error('Failed to save enquiry');
      }
    },
    [isEditMode, selectedEntity, createEnquiry, updateEnquiry, onSuccess]
  );

  return {
    handleSubmit,
    isSubmitting: isCreating || isUpdating,
  };
}
