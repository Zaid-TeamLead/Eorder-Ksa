/**
 * Quotation Mutations Hook
 *
 * Provides CRUD operations + specialized actions for quotations.
 * Uses the shared useCRUDMutations hook for consistency.
 *
 * @example
 * ```tsx
 * const {
 *   createQuotation,
 *   updateQuotation,
 *   deleteQuotation,
 *   supersedeQuotation,
 *   requestApproval,
 *   approveDiscount,
 *   passToCashier,
 *   isCreating,
 *   isSuperseding,
 * } = useQuotationMutations();
 *
 * // Create a new quotation
 * const result = await createQuotation({
 *   enquirySlno: 123,
 *   lineItems: [...],
 *   ...
 * });
 *
 * // Supersede (create new version)
 * await supersedeQuotation({
 *   parentQuotationSlno: 1,
 *   reason: "Price update requested by customer",
 *   ...
 * });
 *
 * // Request discount approval
 * await requestApproval(quotationId, {
 *   discountAmount: -5000,
 *   discountPercentage: 10,
 *   justification: "Loyal customer, high-value purchase",
 *   assignedTo: "Sales Manager",
 * });
 * ```
 */

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCRUDMutations } from "@/hooks/crud/useCRUDMutations";
import { useMutationWithToast } from "@/hooks/mutations/useMutationWithToast";
import {
  createQuotation,
  updateQuotation,
  deleteQuotation,
  supersedeQuotation,
  requestDiscountApproval,
  approveDiscount,
  passToCashier,
  allocateDeposit,
  cancelQuotation,
  logActivity,
} from "@/services/quotation";
import type {
  CreateQuotationData,
  UpdateQuotationData,
  SupersedeQuotationData,
  RequestDiscountApprovalData,
  ApproveDiscountData,
  PassToCashierData,
  AllocateDepositData,
  CancelQuotationData,
  CreateActivityData,
  UseQuotationMutationsReturn,
} from "@/types/quotation";

export function useQuotationMutations(): UseQuotationMutationsReturn {
  const queryClient = useQueryClient();

  // Use shared CRUD mutations hook for create, update, delete
  const { create, update, delete: deleteQuot, isCreating, isUpdating, isDeleting } =
    useCRUDMutations<CreateQuotationData, UpdateQuotationData>({
      createFn: createQuotation,
      updateFn: updateQuotation,
      deleteFn: deleteQuotation,
      queryKey: queryKeys.quotations.all,
      entityName: "Quotation",
    });

  // Supersede mutation (create new version)
  const supersedeMutation = useMutationWithToast({
    mutationFn: (data: SupersedeQuotationData) => supersedeQuotation(data),
    successMessage: "New quotation version created successfully",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
    },
  });

  // Request discount approval mutation
  const requestApprovalMutation = useMutationWithToast({
    mutationFn: ({
      quotationId,
      data,
    }: {
      quotationId: number;
      data: RequestDiscountApprovalData;
    }) => requestDiscountApproval(quotationId, data),
    successMessage: "Discount approval request submitted successfully",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.discountApprovals.all });
    },
  });

  // Approve/reject discount mutation
  const approveDiscountMutation = useMutationWithToast({
    mutationFn: ({
      approvalId,
      data,
    }: {
      approvalId: number;
      data: ApproveDiscountData;
    }) => approveDiscount(approvalId, data),
    successMessage: (_, variables) =>
      variables.data.approvalStatus === "Approved"
        ? "Discount approved successfully"
        : "Discount request rejected",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.discountApprovals.all });
    },
  });

  // Pass to cashier mutation
  const passToCashierMutation = useMutationWithToast({
    mutationFn: ({
      quotationId,
      data,
    }: {
      quotationId: number;
      data: PassToCashierData;
    }) => passToCashier(quotationId, data),
    successMessage: "Quotation passed to cashier successfully",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.openDeposits });
    },
  });

  // Allocate deposit mutation
  const allocateDepositMutation = useMutationWithToast({
    mutationFn: ({
      quotationId,
      data,
    }: {
      quotationId: number;
      data: AllocateDepositData;
    }) => allocateDeposit(quotationId, data),
    successMessage: "Deposit allocated successfully",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.openDeposits });
    },
  });

  // Cancel quotation mutation
  const cancelQuotationMutation = useMutationWithToast({
    mutationFn: ({
      quotationId,
      data,
    }: {
      quotationId: number;
      data: CancelQuotationData;
    }) => cancelQuotation(quotationId, data),
    successMessage: "Quotation cancelled successfully",
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.openDeposits });
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.detail(variables.quotationId),
      });
    },
  });

  // Log activity mutation
  const logActivityMutation = useMutationWithToast({
    mutationFn: ({
      quotationId,
      data,
    }: {
      quotationId: number;
      data: CreateActivityData;
    }) => logActivity(quotationId, data),
    successMessage: "Activity logged successfully",
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.activities(variables.quotationId),
      });
    },
  });

  return {
    createQuotation: create,
    updateQuotation: update,
    deleteQuotation: deleteQuot,
    supersedeQuotation: async (data: SupersedeQuotationData) => {
      return await supersedeMutation.mutateAsync(data);
    },
    requestApproval: async (
      quotationId: number,
      data: RequestDiscountApprovalData
    ) => {
      await requestApprovalMutation.mutateAsync({ quotationId, data });
    },
    approveDiscount: async (approvalId: number, data: ApproveDiscountData) => {
      await approveDiscountMutation.mutateAsync({ approvalId, data });
    },
    passToCashier: async (quotationId: number, data: PassToCashierData) => {
      await passToCashierMutation.mutateAsync({ quotationId, data });
    },
    allocateDeposit: async (quotationId: number, data: AllocateDepositData) => {
      await allocateDepositMutation.mutateAsync({ quotationId, data });
    },
    cancelQuotation: async (quotationId: number, data: CancelQuotationData) => {
      await cancelQuotationMutation.mutateAsync({ quotationId, data });
    },
    isCreating,
    isUpdating,
    isDeleting,
    isSuperseding: supersedeMutation.isPending,
    isCancelling: cancelQuotationMutation.isPending,
  };
}
