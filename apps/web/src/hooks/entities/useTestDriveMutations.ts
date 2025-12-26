/**
 * Test Drive Mutations Hook
 *
 * Provides CRUD operations for test drive bookings.
 * Uses the shared useCRUDMutations hook for consistency.
 *
 * @example
 * ```tsx
 * const {
 *   createBooking,
 *   updateBooking,
 *   deleteBooking,
 *   isCreating,
 * } = useTestDriveMutations();
 *
 * // Create a new booking
 * await createBooking({
 *   customerName: "John Doe",
 *   ...
 * });
 * ```
 */

import { queryKeys } from "@/lib/query-keys";
import { useCRUDMutations } from "@/hooks/crud/useCRUDMutations";
import {
  createBookTestDrive,
  updateBookTestDrive,
  deleteBookTestDrive,
  type CreateBookTestDriveData,
  type UpdateBookTestDriveData,
} from "@/services/bookTestDrive";

export function useTestDriveMutations() {
  const { create, update, delete: deleteBooking, isCreating, isUpdating, isDeleting } =
    useCRUDMutations<CreateBookTestDriveData, UpdateBookTestDriveData>({
      createFn: createBookTestDrive,
      updateFn: updateBookTestDrive,
      deleteFn: deleteBookTestDrive,
      queryKey: queryKeys.testDrive.all,
      entityName: "Test drive booking",
    });

  return {
    createBooking: create,
    updateBooking: update,
    deleteBooking,
    isCreating,
    isUpdating,
    isDeleting,
  };
}
