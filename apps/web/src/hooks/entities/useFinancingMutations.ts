/**
 * Financing Mutations Hook
 *
 * Provides CRUD operations for financing schemes.
 * Uses the shared useCRUDMutations hook for consistency.
 *
 * @example
 * ```tsx
 * const {
 *   createScheme,
 *   updateScheme,
 *   deleteScheme,
 *   setPreferred,
 *   isCreating,
 * } = useFinancingMutations(enquiryId);
 *
 * // Create a new scheme
 * await createScheme({
 *   lenderCode: "ENBD",
 *   termMonths: 48,
 *   ...
 * });
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { useCRUDMutations } from "@/hooks/crud/useCRUDMutations";
import {
  createFinancing,
  updateFinancing,
  deleteFinancing,
  setPreferredScheme,
} from "@/services/financing";
import type {
  CreateFinancingData,
  UpdateFinancingData,
  UseFinancingMutationsReturn,
} from "@/types/financing";

export function useFinancingMutations(
  enquiryId: number
): UseFinancingMutationsReturn {
  const queryClient = useQueryClient();

  // Use shared CRUD mutations hook
  const { create, update, delete: deleteScheme, isCreating, isUpdating, isDeleting } =
    useCRUDMutations<CreateFinancingData, UpdateFinancingData>({
      createFn: createFinancing,
      updateFn: updateFinancing,
      deleteFn: deleteFinancing,
      queryKey: queryKeys.financing.schemes(enquiryId),
      entityName: "Financing scheme",
    });

  // Set preferred scheme mutation (custom, not part of CRUD)
  const setPreferredMutation = useMutation({
    mutationFn: ({ id }: { id: number }) => setPreferredScheme(id, enquiryId),
    onSuccess: () => {
      toast.success("Preferred scheme updated successfully");
      queryClient.invalidateQueries({
        queryKey: queryKeys.financing.schemes(enquiryId),
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update preferred scheme"
      );
    },
  });

  return {
    createScheme: async (data: CreateFinancingData) => {
      // Add enquirySlno to the data
      await create({
        ...data,
        enquirySlno: enquiryId,
      });
    },
    updateScheme: update,
    deleteScheme,
    setPreferred: async (id: number) => {
      await setPreferredMutation.mutateAsync({ id });
    },
    isCreating,
    isUpdating,
    isDeleting,
  };
}
