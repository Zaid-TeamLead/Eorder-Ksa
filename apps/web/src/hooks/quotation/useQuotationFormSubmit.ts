import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuotationMutations } from '../entities/useQuotationMutations';
import type { QuotationFormData } from '@/forms/quotation/schema';
import { logger } from '@/lib/logger';

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
        if (isSuperseding && supersedeId) {
          const reason = data.supersedeReason?.trim() || '';
          if (!reason) {
            toast.error('Reason for new version is required');
            return;
          }

          const { supersedeReason: _ignored, ...quotationData } = data;

          // Supersede flow - creating new version
          const supersedeData = {
            parentQuotationSlno: parseInt(supersedeId, 10),
            reason,
            ...quotationData,
            status,
          };
          await supersedeQuotation(supersedeData);
          router.push(`/dashboard/quotations/${supersedeId}`);
          return;
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
        logger.error('Error creating quotation:', error);
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
