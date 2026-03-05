/**
 * Type Definitions for Sales Enquiry Module
 */

import type {
  CreateEnquiryData as ServiceCreateEnquiryData,
  SalesEnquiry as ServiceSalesEnquiry,
  UpdateEnquiryData as ServiceUpdateEnquiryData,
} from "@/services/enquiry";

// ============================================================================
// API Response Types (Matching Database Schema)
// ============================================================================

export type SalesEnquiry = ServiceSalesEnquiry;

// ============================================================================
// API Request Types
// ============================================================================

export type CreateEnquiryData = ServiceCreateEnquiryData;
export type UpdateEnquiryData = ServiceUpdateEnquiryData;

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseEnquiriesReturn {
  enquiries: SalesEnquiry[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseEnquiryMutationsReturn {
  createEnquiry: (data: CreateEnquiryData) => Promise<void>;
  updateEnquiry: (id: number, data: UpdateEnquiryData) => Promise<void>;
  deleteEnquiry: (id: number) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export interface UseEnquiryStatusUpdateReturn {
  updateStatus: (id: number, status: string) => Promise<void>;
  isUpdating: boolean;
}
