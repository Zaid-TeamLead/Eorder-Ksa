/**
 * Mutation with Toast Hook
 *
 * Wrapper for useMutation that automatically handles toast notifications
 * for success and error states.
 *
 * Benefits:
 * - Eliminates 30+ duplicate toast calls across modules
 * - Standardized error messages
 * - Consistent user feedback
 * - Cleaner component code
 *
 * @example
 * ```tsx
 * const updateStatusMutation = useMutationWithToast({
 *   mutationFn: ({ id, status }) => updateEnquiryStatus(id, status),
 *   successMessage: "Status updated successfully",
 *   errorMessage: "Failed to update status",
 *   onSuccess: () => {
 *     // Additional success handling
 *   },
 * });
 * ```
 */

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import type { MutationWithToastConfig } from "@/types/common";

function getApiErrorMessage(error: any): string {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    "An error occurred"
  );
}

export function useMutationWithToast<TData, TVariables>({
  mutationFn,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  ...options
}: MutationWithToastConfig<TData, TVariables> &
  Omit<
    UseMutationOptions<TData, any, TVariables>,
    "mutationFn" | "onSuccess" | "onError"
  >) {
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Show toast
      if (typeof successMessage === "function") {
        toast.success(successMessage(data, variables));
      } else {
        toast.success(successMessage);
      }

      // Call custom onSuccess handler if provided
      onSuccess?.(data, variables);
    },
    onError: (error: any, variables, context) => {
      // Show toast
      if (typeof errorMessage === "function") {
        toast.error(errorMessage(error));
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        // Default error message
        toast.error(getApiErrorMessage(error));
      }

      // Call custom onError handler if provided
      onError?.(error, variables);
    },
    ...options,
  });
}
