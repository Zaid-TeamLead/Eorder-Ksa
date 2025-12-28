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
          const result = await supersedeQuotation(supersedeData);
          toast.success(`New version ${result.quotationNumber} created successfully!`);
        } else {
          // Regular create flow from enquiry
          const quotationData = {
            ...data,
            status,
          };
          const result = await createQuotation(quotationData);

          if (status === 'Draft') {
            toast.success(`Quotation ${result.quotationNumber} saved as draft!`);
          } else {
            toast.success(`Quotation ${result.quotationNumber} created and sent!`);
          }
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
