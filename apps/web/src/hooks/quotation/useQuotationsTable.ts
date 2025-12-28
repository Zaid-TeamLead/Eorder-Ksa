import { useState, useMemo } from 'react';
import type { Quotation } from '@/types/quotation';

interface UseQuotationsTableParams {
  quotations: Quotation[];
  initialFilter?: string;
}

/**
 * Custom hook for managing quotations table state and filtering
 */
export function useQuotationsTable({
  quotations,
  initialFilter = 'all',
}: UseQuotationsTableParams) {
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);

  const filteredQuotations = useMemo(
    () =>
      statusFilter === 'all'
        ? quotations
        : quotations.filter((q) => q.STATUS === statusFilter),
    [quotations, statusFilter]
  );

  return {
    filteredQuotations,
    statusFilter,
    setStatusFilter,
  };
}
