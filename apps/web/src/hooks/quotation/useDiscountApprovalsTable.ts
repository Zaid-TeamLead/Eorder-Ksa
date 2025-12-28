import { useState, useMemo, useCallback } from 'react';
import type { DiscountApproval } from '@/types/quotation';

interface UseDiscountApprovalsTableParams {
  approvals: DiscountApproval[];
  initialFilter?: string;
}

/**
 * Custom hook for managing discount approvals table state, filtering, and interactions
 */
export function useDiscountApprovalsTable({
  approvals,
  initialFilter = 'Pending',
}: UseDiscountApprovalsTableParams) {
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [expandedApprovalId, setExpandedApprovalId] = useState<number | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<DiscountApproval | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  const filteredApprovals = useMemo(
    () =>
      statusFilter === 'all'
        ? approvals
        : approvals.filter((approval) => approval.STATUS === statusFilter),
    [approvals, statusFilter]
  );

  const toggleExpandApproval = useCallback((approvalId: number) => {
    setExpandedApprovalId((prev) => (prev === approvalId ? null : approvalId));
  }, []);

  const handleApproveClick = useCallback((approval: DiscountApproval) => {
    setSelectedApproval(approval);
    setApprovalDialogOpen(true);
  }, []);

  const handleApprovalSuccess = useCallback(() => {
    setApprovalDialogOpen(false);
    setSelectedApproval(null);
  }, []);

  return {
    filteredApprovals,
    statusFilter,
    setStatusFilter,
    expandedApprovalId,
    toggleExpandApproval,
    selectedApproval,
    handleApproveClick,
    approvalDialogOpen,
    setApprovalDialogOpen,
    handleApprovalSuccess,
  };
}
