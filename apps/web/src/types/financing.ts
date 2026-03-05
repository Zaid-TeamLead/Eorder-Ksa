/**
 * Type Definitions for Financing/Bank Funding Module
 */

import { z } from "zod";
import type {
  CreateFinancingData as ServiceCreateFinancingData,
  Financing as ServiceFinancing,
  Lender as ServiceLender,
  UpdateFinancingData as ServiceUpdateFinancingData,
} from "@/services/financing";

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

export type CreateFinancingData = ServiceCreateFinancingData;
export type UpdateFinancingData = ServiceUpdateFinancingData;

// ============================================================================
// API Response Types (Matching Database Schema)
// ============================================================================

export type Financing = ServiceFinancing;
export type Lender = ServiceLender;

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
