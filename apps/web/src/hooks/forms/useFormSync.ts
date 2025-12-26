/**
 * Form Sync Hook
 *
 * Automatically syncs react-hook-form with query data.
 * Eliminates manual useEffect for form synchronization.
 *
 * Benefits:
 * - Eliminates manual useEffect for form sync
 * - Handles loading states properly
 * - Proper form reset logic
 * - Type-safe data transformation
 *
 * @example
 * ```tsx
 * const { data: enquiry } = useQuery({...});
 * const form = useForm<EnquiryFormData>({...});
 *
 * useFormSync({
 *   data: enquiry,
 *   form,
 *   transform: (enquiry) => ({
 *     customerName: enquiry.CUSTOMERNAME || "",
 *     mobile: enquiry.MOBILE || "",
 *     // ... map database fields to form fields
 *   }),
 * });
 * ```
 */

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FormSyncConfig } from "@/types/common";

export function useFormSync<T>({ data, form, transform }: FormSyncConfig<T>): void {
  useEffect(() => {
    if (data) {
      const formData = transform ? transform(data) : data;

      // Reset form with new data
      form.reset(formData, {
        keepDefaultValues: false,
        keepDirty: false,
        keepErrors: false,
      });
    }
  }, [data, form, transform]);
}
