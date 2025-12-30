import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuotationMutations } from '../entities/useQuotationMutations';
import type { QuotationFormData } from '@/forms/quotation/schema';

interface UseQuotationFormSubmitParams {
  isSuperseding: boolean;
  supersedeId?: string | null;
}

/**
 * Custom hook for handling quotation form submission
 * Handles both create and supersede flows
 */
export function useQuotationFormSubmit({
  isSuperseding,
  supersedeId,
}: UseQuotationFormSubmitParams) {
  const router = useRouter();
  const { createQuotation, supersedeQuotation, isCreating } = useQuotationMutations();

  const handleSubmit = useCallback(
    async (data: QuotationFormData, status: 'Draft' | 'Sent') => {
      try {
        if (isSuperseding && supersedeId && data.supersedeReason) {
          // Supersede flow - creating new version
          const supersedeData = {
            parentQuotationSlno: parseInt(supersedeId),
            reason: data.supersedeReason,
            ...data,
            status,
          };
          await supersedeQuotation(supersedeData);
        } else {
          // Regular create flow from enquiry
          const quotationData = {
            ...data,
            status,
          };
          await createQuotation(quotationData);
        }

        // Redirect to quotations list
        router.push('/dashboard/quotations');
      } catch (error) {
        console.error('Error creating quotation:', error);
        toast.error('Failed to create quotation');
      }
    },
    [isSuperseding, supersedeId, createQuotation, supersedeQuotation, router]
  );

  const handleSaveAsDraft = useCallback(
    (data: QuotationFormData) => handleSubmit(data, 'Draft'),
    [handleSubmit]
  );

  const handleSaveAndSend = useCallback(
    (data: QuotationFormData) => handleSubmit(data, 'Sent'),
    [handleSubmit]
  );

  return {
    handleSubmit,
    handleSaveAsDraft,
    handleSaveAndSend,
    isCreating,
  };
}
