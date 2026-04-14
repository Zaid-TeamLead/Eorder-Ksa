import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SalesEnquiry } from '@/services/enquiry';
import { toast } from 'sonner';

interface ImmediateTestDriveDefaults {
  customerId?: string;
  customerName?: string;
  postcode?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  registrationNumber?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
}

interface QuotationEnquiryPrefill {
  SLNO: number;
  CUSTOMERNAME?: string;
  MOBILE?: string;
  HOMEEMAIL?: string;
  ADDRESS?: string;
  MAKE?: string;
  MAKENAME?: string;
  MODEL?: string;
  MODELNAME?: string;
  VARIANT?: string;
  VARIANTNAME?: string;
  YEAR?: string;
  COLOR?: string;
  QUANTITY?: number;
  VINNUMBER?: string;
  VINDETAILS?: SalesEnquiry['VINDETAILS'];
}

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

  const pickFirstString = useCallback(
    (record: Record<string, unknown>, keys: string[]): string => {
      for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
      return '';
    },
    []
  );

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

  const getVehicleRecordForVin = useCallback(
    (enquiry: SalesEnquiry, vin: string): Record<string, unknown> => {
      const vinDetails = enquiry.VINDETAILS as unknown;
      if (!vinDetails || typeof vinDetails !== 'object') {
        return {};
      }

      const record = vinDetails as Record<string, unknown>;
      const selectedVehicleLines = Array.isArray(record.SELECTED_VEHICLE_LINES)
        ? (record.SELECTED_VEHICLE_LINES as Array<Record<string, unknown>>)
        : [];

      const matchingLine = selectedVehicleLines.find((line) => {
        const directVin = line.vinValue;
        if (directVin !== undefined && directVin !== null && String(directVin).trim() === vin) {
          return true;
        }

        const nestedVin =
          line.vin && typeof line.vin === 'object'
            ? pickFirstString(line.vin as Record<string, unknown>, [
                'VINNUMBER',
                'VIN',
                'vinNumber',
                'vin',
                'U_Veh_StockID',
                'u_veh_stockid',
              ])
            : '';

        return nestedVin === vin;
      });

      if (matchingLine?.vin && typeof matchingLine.vin === 'object') {
        return matchingLine.vin as Record<string, unknown>;
      }

      return record;
    },
    [pickFirstString]
  );

  const buildImmediateTestDriveDefaults = useCallback(
    (enquiry: SalesEnquiry, vin: string): ImmediateTestDriveDefaults => {
      const vehicleRecord = getVehicleRecordForVin(enquiry, vin);

      return {
        customerId: enquiry.CUSTOMERID || '',
        customerName: enquiry.CUSTOMERNAME || '',
        postcode: enquiry.POSTCODE || '',
        address: enquiry.ADDRESS || '',
        phoneNumber: enquiry.MOBILE || enquiry.HOMEPHONE || enquiry.WORKPHONE || '',
        email: enquiry.HOMEEMAIL || '',
        registrationNumber: vin,
        manufacturer:
          enquiry.MAKENAME ||
          enquiry.MAKE ||
          pickFirstString(vehicleRecord, ['U_Veh_Brand', 'Brand', 'MAKENAME', 'MAKE', 'Make']),
        model:
          enquiry.MODELNAME ||
          enquiry.MODEL ||
          pickFirstString(vehicleRecord, [
            'U_Veh_ModelDescr',
            'Model',
            'MODELNAME',
            'MODEL',
            'ItemName',
          ]),
        variant:
          enquiry.VARIANTNAME ||
          enquiry.VARIANT ||
          pickFirstString(vehicleRecord, ['Variant', 'VARIANTNAME', 'VARIANT', 'ItemCode']),
      };
    },
    [getVehicleRecordForVin, pickFirstString]
  );

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
      const prefillKey = `quotation-create-enquiry-${enquiry.SLNO}`;
      const lightweightPrefill: QuotationEnquiryPrefill = {
        SLNO: enquiry.SLNO,
        CUSTOMERNAME: enquiry.CUSTOMERNAME,
        MOBILE: enquiry.MOBILE,
        HOMEEMAIL: enquiry.HOMEEMAIL,
        ADDRESS: enquiry.ADDRESS,
        MAKE: enquiry.MAKE,
        MAKENAME: enquiry.MAKENAME,
        MODEL: enquiry.MODEL,
        MODELNAME: enquiry.MODELNAME,
        VARIANT: enquiry.VARIANT,
        VARIANTNAME: enquiry.VARIANTNAME,
        YEAR: enquiry.YEAR,
        COLOR: enquiry.COLOR,
        QUANTITY: enquiry.QUANTITY,
        VINNUMBER: enquiry.VINNUMBER,
        VINDETAILS: enquiry.VINDETAILS,
      };

      try {
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(prefillKey, JSON.stringify(lightweightPrefill));
        }
      } catch {
        // Ignore storage failures and allow API fallback on the quotation page.
      }

      const prefillData = encodeURIComponent(JSON.stringify(lightweightPrefill));
      router.push(
        `/dashboard/quotations/create?enquiryId=${enquiry.SLNO}&prefillKey=${encodeURIComponent(prefillKey)}&prefillData=${prefillData}`
      );
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

      const params = new URLSearchParams({
        action: 'create',
        immediate: 'true',
        enquiryId: String(enquiry.SLNO),
        vehicleVin: vin,
        enquiryDefaults: JSON.stringify(buildImmediateTestDriveDefaults(enquiry, vin)),
      });

      router.push(`/dashboard/test-drive?${params.toString()}`);
    },
    [buildImmediateTestDriveDefaults, extractEnquiryVin, router]
  );

  return {
    handleTradeInAppraisal,
    handleBankFunding,
    handleGenerateQuotation,
    handleBookTestDriveNow,
  };
}
