import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuotationMutations } from '../entities/useQuotationMutations';
import { logger } from '@/lib/logger';
import type { CancelQuotationData } from '@/types/quotation';

interface UseQuotationActionsParams {
  quotationId?: number;
  onSuccess?: () => void;
}

/**
 * Custom hook for quotation actions (view, edit, print, delete, supersede)
 * Centralizes all quotation-related navigation and mutations
 */
export function useQuotationActions(params: UseQuotationActionsParams = {}) {
  const { quotationId, onSuccess } = params;
  const router = useRouter();
  const { deleteQuotation, cancelQuotation, isDeleting, isCancelling } = useQuotationMutations();

  const handleView = useCallback(
    (id?: number) => {
      const targetId = id || quotationId;
      if (!targetId) return;
      router.push(`/dashboard/quotations/${targetId}`);
    },
    [router, quotationId]
  );

  const handleEdit = useCallback(
    (id?: number) => {
      const targetId = id || quotationId;
      if (!targetId) return;
      router.push(`/dashboard/quotations/${targetId}/edit`);
    },
    [router, quotationId]
  );

  const handlePrint = useCallback(
    (id?: number) => {
      const targetId = id || quotationId;
      if (!targetId) return;
      router.push(`/dashboard/quotations/print/${targetId}`);
    },
    [router, quotationId]
  );

  const handleDelete = useCallback(
    async (id?: number) => {
      const targetId = id || quotationId;
      if (!targetId) return;

      try {
        await deleteQuotation(targetId);
        toast.success('Quotation deleted successfully');
        onSuccess?.();
      } catch (error) {
        logger.error('Error deleting quotation:', error);
        toast.error('Failed to delete quotation');
      }
    },
    [deleteQuotation, quotationId, onSuccess]
  );

  const handleSupersede = useCallback(
    (id?: number) => {
      const targetId = id || quotationId;
      if (!targetId) return;
      router.push(`/dashboard/quotations/create?supersede=${targetId}`);
    },
    [router, quotationId]
  );

  const handleBack = useCallback(() => {
    router.push('/dashboard/quotations');
  }, [router]);

  const handleCancel = useCallback(
    async (data: CancelQuotationData, id?: number) => {
      const targetId = id || quotationId;
      if (!targetId) return;

      try {
        await cancelQuotation(targetId, data);
        toast.success('Quotation cancelled successfully');
        onSuccess?.();
      } catch (error) {
        logger.error('Error cancelling quotation:', error);
        toast.error('Failed to cancel quotation');
      }
    },
    [cancelQuotation, quotationId, onSuccess]
  );

  const handlePassToCashier = useCallback(() => {
    toast.info('Pass to cashier functionality coming soon');
  }, []);

  const handleRequestApproval = useCallback(() => {
    toast.info('Request approval functionality coming soon');
  }, []);

  return {
    handleView,
    handleEdit,
    handlePrint,
    handleDelete,
    handleCancel,
    handleSupersede,
    handleBack,
    handlePassToCashier,
    handleRequestApproval,
    isDeleting,
    isCancelling,
  };
}
