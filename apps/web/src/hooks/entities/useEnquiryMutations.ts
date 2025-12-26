/**
 * Enquiry Mutations Hook
 *
 * Provides CRUD operations + status update for sales enquiries.
 * Uses the shared useCRUDMutations hook for consistency.
 *
 * @example
 * ```tsx
 * const {
 *   createEnquiry,
 *   updateEnquiry,
 *   deleteEnquiry,
 *   updateStatus,
 *   isCreating,
 * } = useEnquiryMutations();
 *
 * // Create a new enquiry
 * await createEnquiry({
 *   customerName: "John Doe",
 *   ...
 * });
 *
 * // Update status
 * await updateStatus(enquiryId, "Qualified");
 * ```
 */

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useCRUDMutations } from "@/hooks/crud/useCRUDMutations";
import { useMutationWithToast } from "@/hooks/mutations/useMutationWithToast";
import {
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  updateEnquiryStatus,
} from "@/services/enquiry";
import type {
  CreateEnquiryData,
  UpdateEnquiryData,
  UseEnquiryMutationsReturn,
  UseEnquiryStatusUpdateReturn,
} from "@/types/enquiry";

export function useEnquiryMutations(): UseEnquiryMutationsReturn {
  const queryClient = useQueryClient();

  // Use shared CRUD mutations hook for create, update, delete
  const { create, update, delete: deleteEnq, isCreating, isUpdating, isDeleting } =
    useCRUDMutations<CreateEnquiryData, UpdateEnquiryData>({
      createFn: createEnquiry,
      updateFn: updateEnquiry,
      deleteFn: deleteEnquiry,
      queryKey: queryKeys.enquiries.all,
      entityName: "Enquiry",
    });

  // Separate mutation for status update (not part of standard CRUD)
  const statusUpdateMutation = useMutationWithToast({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateEnquiryStatus(id, status),
    successMessage: "Status updated successfully",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
    },
  });

  return {
    createEnquiry: create,
    updateEnquiry: update,
    deleteEnquiry: deleteEnq,
    updateStatus: async (id: number, status: string) => {
      await statusUpdateMutation.mutateAsync({ id, status });
    },
    isCreating,
    isUpdating,
    isDeleting,
  };
}

// Also export a separate status update hook if needed elsewhere
export function useEnquiryStatusUpdate(): UseEnquiryStatusUpdateReturn {
  const queryClient = useQueryClient();

  const statusUpdateMutation = useMutationWithToast({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateEnquiryStatus(id, status),
    successMessage: "Status updated successfully",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
    },
  });

  return {
    updateStatus: async (id: number, status: string) => {
      await statusUpdateMutation.mutateAsync({ id, status });
    },
    isUpdating: statusUpdateMutation.isPending,
  };
}
