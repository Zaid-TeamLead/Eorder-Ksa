/**
 * Generic CRUD Mutations Hook
 *
 * This hook provides a standardized way to handle Create, Read, Update, Delete
 * mutations for any entity in the application.
 *
 * Benefits:
 * - Eliminates 20+ duplicate mutation setups across modules
 * - Standardized toast notifications
 * - Automatic query invalidation
 * - Type-safe operations
 * - Consistent error handling
 *
 * @example
 * ```tsx
 * const { create, update, delete: deleteEnquiry, isCreating } = useCRUDMutations({
 *   createFn: createEnquiry,
 *   updateFn: updateEnquiry,
 *   deleteFn: deleteEnquiry,
 *   queryKey: queryKeys.enquiries.all,
 *   entityName: "Enquiry",
 * });
 * ```
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CRUDMutationsConfig, CRUDMutationsReturn } from "@/types/common";

export function useCRUDMutations<TCreate, TUpdate = Partial<TCreate>>({
  createFn,
  updateFn,
  deleteFn,
  queryKey,
  entityName,
}: CRUDMutationsConfig<TCreate, TUpdate>): CRUDMutationsReturn<TCreate, TUpdate> {
  const queryClient = useQueryClient();

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      toast.success(`${entityName} created successfully`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          `Failed to create ${entityName.toLowerCase()}`
      );
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TUpdate }) =>
      updateFn(id, data),
    onSuccess: () => {
      toast.success(`${entityName} updated successfully`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          `Failed to update ${entityName.toLowerCase()}`
      );
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      toast.success(`${entityName} deleted successfully`);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          `Failed to delete ${entityName.toLowerCase()}`
      );
    },
  });

  return {
    create: async (data: TCreate) => {
      await createMutation.mutateAsync(data);
    },
    update: async (id: number, data: TUpdate) => {
      await updateMutation.mutateAsync({ id, data });
    },
    delete: async (id: number) => {
      await deleteMutation.mutateAsync(id);
    },
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
