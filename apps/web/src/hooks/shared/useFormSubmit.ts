import { useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

interface UseFormSubmitOptions<TFormData, TPayload, TResponse> {
  /** Whether we're in edit mode */
  isEditMode: boolean;
  /** The selected entity (for edit mode) */
  selectedEntity?: { id: number } | null;
  /** Create mutation function */
  createMutation: (payload: TPayload) => Promise<TResponse>;
  /** Update mutation function */
  updateMutation: (id: number, payload: TPayload) => Promise<TResponse>;
  /** Function to transform form data to API payload */
  transformData: (data: TFormData, isEdit: boolean) => TPayload;
  /** Callback on successful submission */
  onSuccess?: (response: TResponse) => void;
  /** Entity name for logging/toasts. Default: 'Entity' */
  entityName?: string;
  /** Whether create mutation is in progress */
  isCreating: boolean;
  /** Whether update mutation is in progress */
  isUpdating: boolean;
}

interface UseFormSubmitReturn<TFormData> {
  handleSubmit: (data: TFormData) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Generic hook for form submission logic
 *
 * Handles the common pattern of create/update operations with
 * data transformation, loading states, and error handling.
 *
 * @example
 * ```typescript
 * const { handleSubmit, isSubmitting } = useFormSubmit({
 *   isEditMode,
 *   selectedEntity: selectedEnquiry,
 *   createMutation: create,
 *   updateMutation: update,
 *   transformData: transformEnquiryFormData,
 *   onSuccess: () => router.push('/enquiries'),
 *   entityName: 'Enquiry',
 *   isCreating,
 *   isUpdating,
 * });
 * ```
 */
export function useFormSubmit<TFormData, TPayload, TResponse>({
  isEditMode,
  selectedEntity,
  createMutation,
  updateMutation,
  transformData,
  onSuccess,
  entityName = 'Entity',
  isCreating,
  isUpdating,
}: UseFormSubmitOptions<TFormData, TPayload, TResponse>): UseFormSubmitReturn<TFormData> {
  const handleSubmit = useCallback(
    async (data: TFormData) => {
      try {
        const payload = transformData(data, isEditMode);

        let response: TResponse;
        if (isEditMode && selectedEntity) {
          logger.info(`Updating ${entityName}:`, payload);
          response = await updateMutation(selectedEntity.id, payload);
          toast.success(`${entityName} updated successfully`);
        } else {
          logger.info(`Creating ${entityName}:`, payload);
          response = await createMutation(payload);
          toast.success(`${entityName} created successfully`);
        }

        onSuccess?.(response);
      } catch (error) {
        logger.error(`Error ${isEditMode ? 'updating' : 'creating'} ${entityName}:`, error);
        toast.error(`Failed to ${isEditMode ? 'update' : 'create'} ${entityName.toLowerCase()}`);
        throw error;
      }
    },
    [
      isEditMode,
      selectedEntity,
      createMutation,
      updateMutation,
      transformData,
      onSuccess,
      entityName,
    ]
  );

  return {
    handleSubmit,
    isSubmitting: isCreating || isUpdating,
  };
}
