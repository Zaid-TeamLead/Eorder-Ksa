/**
 * Type Definitions for Financing/Bank Funding Module
 */

import { z } from "zod";

// ============================================================================
// Form Validation Schemas
// ============================================================================

export const financeSchemeFormSchema = z.object({
  lenderCode: z.string().min(1, "Lender is required"),
  vehiclePrice: z.string().optional(),
  term: z.string().min(1, "Term is required"),
  downpayment: z.string().optional(),
  tradeInValue: z.string().optional(),
  interestRate: z.string().optional(),
  fda: z.string().optional(),
  gpvBalloon: z.string().optional(),
  saleCode: z.string().optional(),
});

export type FinanceSchemeFormData = z.infer<typeof financeSchemeFormSchema>;

// ============================================================================
// API Request Types
// ============================================================================

export interface CreateFinancingData {
  enquirySlno: number;
  lenderCode: string;
  lenderName: string;
  vehiclePrice?: number;
  termMonths: number;
  downpayment?: number;
  tradeInValue?: number;
  interestRate?: number;
  fda?: number;
  monthlyPayment?: number;
  gpvBalloon?: number;
  saleCode?: string;
}

export interface UpdateFinancingData
  extends Partial<Omit<CreateFinancingData, "enquirySlno">> {}

// ============================================================================
// API Response Types (Matching Database Schema)
// ============================================================================

export interface Financing {
  SLNO: number;
  ENQUIRY_SLNO: number;
  LENDER_CODE: string;
  LENDER_NAME: string;
  VEHICLE_PRICE: string | null;
  DOWNPAYMENT: string | null;
  TERM_MONTHS: number;
  INTEREST_RATE: string | null;
  MONTHLY_PAYMENT: string | null;
  FDA: string | null;
  GPV_BALLOON: string | null;
  SALE_CODE: string | null;
  TRADE_IN_VALUE: string | null;
  IS_SELECTED: string;
  STATUS: string;
  IS_DELETED: string;
  CREATED_DATE: string;
  CREATED_BY: string | null;
  LAST_UPDATED_DATE: string | null;
  LAST_UPDATED_BY: string | null;
}

export interface Lender {
  LENDER_CODE: string;
  LENDER_NAME: string;
  DESCRIPTION: string | null;
  IS_ACTIVE: string;
  CREATED_DATE: string;
  CREATED_BY: string | null;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseFinancingSchemesReturn {
  schemes: Financing[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseFinancingMutationsReturn {
  createScheme: (data: CreateFinancingData) => Promise<void>;
  updateScheme: (id: number, data: UpdateFinancingData) => Promise<void>;
  deleteScheme: (id: number) => Promise<void>;
  setPreferred: (id: number) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseLendersReturn {
  lenders: Lender[];
  isLoading: boolean;
  error: Error | null;
}
