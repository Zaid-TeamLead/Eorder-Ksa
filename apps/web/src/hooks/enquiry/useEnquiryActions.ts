import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SalesEnquiry } from '@/services/enquiry';
import { toast } from 'sonner';

export interface UseEnquiryActionsReturn {
  handleTradeInAppraisal: (enquiry: SalesEnquiry) => void;
  handleBankFunding: (enquiry: SalesEnquiry) => void;
  handleGenerateQuotation: (enquiry: SalesEnquiry) => void;
  handleBookTestDriveNow: (enquiry: SalesEnquiry) => void;
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

  const extractEnquiryVin = useCallback((enquiry: SalesEnquiry): string => {
    if (enquiry.VINNUMBER?.trim()) {
      return enquiry.VINNUMBER.trim();
    }

    const vinDetails = enquiry.VINDETAILS as unknown;
    if (!vinDetails || typeof vinDetails !== 'object') {
      return '';
    }

    const record = vinDetails as Record<string, unknown>;
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
      const lower = key.toLowerCase();
      return lower.includes('vin') || lower.includes('stockid');
    });

    return dynamicMatch ? String(dynamicMatch[1]).trim() : '';
  }, []);

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

  const handleBookTestDriveNow = useCallback(
    (enquiry: SalesEnquiry) => {
      const vin = extractEnquiryVin(enquiry);
      if (!vin) {
        toast.error('Please select/save a VIN first before booking test drive now.');
        return;
      }

      router.push(
        `/dashboard/test-drive?action=create&immediate=true&enquiryId=${enquiry.SLNO}&vehicleVin=${encodeURIComponent(vin)}`
      );
    },
    [extractEnquiryVin, router]
  );

  return {
    handleTradeInAppraisal,
    handleBankFunding,
    handleGenerateQuotation,
    handleBookTestDriveNow,
  };
}
