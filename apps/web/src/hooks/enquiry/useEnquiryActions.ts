import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SalesEnquiry } from '@/services/enquiry';

export interface UseEnquiryActionsReturn {
  handleTradeInAppraisal: (enquiry: SalesEnquiry) => void;
  handleBankFunding: (enquiry: SalesEnquiry) => void;
  handleGenerateQuotation: (enquiry: SalesEnquiry) => void;
}

/**
 * Custom hook for enquiry-related actions
 *
 * Centralizes all enquiry-related navigation handlers:
 * - Navigate to trade-in appraisal
 * - Navigate to bank funding
 * - Navigate to quotation creation
 *
 * @example
 * ```tsx
 * const {
 *   handleTradeInAppraisal,
 *   handleBankFunding,
 *   handleGenerateQuotation,
 * } = useEnquiryActions();
 *
 * // In your column actions:
 * <MenuItem onClick={() => handleGenerateQuotation(enquiry)}>
 *   Generate Quotation
 * </MenuItem>
 * ```
 */
export function useEnquiryActions(): UseEnquiryActionsReturn {
  const router = useRouter();

  const handleTradeInAppraisal = useCallback(
    (enquiry: SalesEnquiry) => {
      router.push(`/dashboard/trade-in-appraisal/${enquiry.SLNO}`);
    },
    [router]
  );

  const handleBankFunding = useCallback(
    (enquiry: SalesEnquiry) => {
      router.push(`/dashboard/bank-funding/${enquiry.SLNO}`);
    },
    [router]
  );

  const handleGenerateQuotation = useCallback(
    (enquiry: SalesEnquiry) => {
      router.push(`/dashboard/quotations/create?enquiryId=${enquiry.SLNO}`);
    },
    [router]
  );

  return {
    handleTradeInAppraisal,
    handleBankFunding,
    handleGenerateQuotation,
  };
}
