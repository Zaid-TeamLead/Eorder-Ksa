/**
 * Generic CRUD Mutations Hook
 *
 * This hook provides a standardized way to handle Create, Read, Update, Delete
 * mutations for any entity in the application.
 *
 * Benefits:
 * - Eliminates 20+ duplicate mutation setups across modules
 * - Automatic query invalidation
 * - Type-safe operations
 * - Consistent error logging
 *
 * Note: This hook does NOT show toast notifications. User-facing success/error
 * messages should be handled by higher-level hooks like useFormSubmit.
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
import type { CRUDMutationsConfig, CRUDMutationsReturn } from "@/types/common";
import { logger } from "@/lib/logger";

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
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      logger.error(`Error creating ${entityName.toLowerCase()}:`, error);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TUpdate }) => {
      logger.info(`[useCRUDMutations] Calling ${entityName} update API with ID: ${id}, Data:`, data);
      return updateFn(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      logger.error(`Error updating ${entityName.toLowerCase()}:`, error);
      logger.error(`Error details:`, {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
      });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: any) => {
      logger.error(`Error deleting ${entityName.toLowerCase()}:`, error);
    },
  });

  return {
    create: async (data: TCreate) => {
      return await createMutation.mutateAsync(data);
    },
    update: async (id: number, data: TUpdate) => {
      return await updateMutation.mutateAsync({ id, data });
    },
    delete: async (id: number) => {
      return await deleteMutation.mutateAsync(id);
    },
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
