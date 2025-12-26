/**
 * Type Definitions for Customer Module
 */

// ============================================================================
// Customer Data Types
// ============================================================================

export interface Customer {
  CardCode?: string;
  CardName?: string;
  Street?: string;
  Block?: string;
  StreetNo?: string;
  Address2?: string;
  Address3?: string;
  City?: string;
  County?: string;
  ZipCode?: string;
  Phone1?: string;
  Phone2?: string;
  Cellular?: string;
  E_Mail?: string;
}

export interface CustomerSearchResult {
  success: boolean;
  data: Customer[];
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseCustomerSearchReturn {
  search: (query: string) => Promise<void>;
  results: Customer[];
  isSearching: boolean;
  error: Error | null;
  clear: () => void;
}

export interface UseCustomerDetailsReturn {
  customer: Customer | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
