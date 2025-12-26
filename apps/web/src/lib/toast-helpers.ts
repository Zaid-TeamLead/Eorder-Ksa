/**
 * Standardized Toast Notification Helpers
 *
 * This file provides consistent toast messages for all CRUD operations across modules.
 * Benefits:
 * - Consistent user feedback messages
 * - Centralized error message formatting
 * - Easy to update messages globally
 * - Type-safe toast helpers
 */

import { toast } from "sonner";

// ============================================================================
// Generic CRUD Toast Helpers
// ============================================================================

export const createCRUDToasts = (entityName: string) => ({
  createSuccess: (customMessage?: string) =>
    toast.success(customMessage || `${entityName} created successfully`),

  createError: (error?: any) =>
    toast.error(
      error?.response?.data?.message || `Failed to create ${entityName.toLowerCase()}`
    ),

  updateSuccess: (customMessage?: string) =>
    toast.success(customMessage || `${entityName} updated successfully`),

  updateError: (error?: any) =>
    toast.error(
      error?.response?.data?.message || `Failed to update ${entityName.toLowerCase()}`
    ),

  deleteSuccess: (customMessage?: string) =>
    toast.success(customMessage || `${entityName} deleted successfully`),

  deleteError: (error?: any) =>
    toast.error(
      error?.response?.data?.message || `Failed to delete ${entityName.toLowerCase()}`
    ),
});

// ============================================================================
// Module-Specific Toast Helpers
// ============================================================================

// Enquiries
export const enquiryToasts = {
  createSuccess: () => toast.success("Sales enquiry created successfully"),
  createError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to create enquiry"),

  updateSuccess: () => toast.success("Sales enquiry updated successfully"),
  updateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update enquiry"),

  deleteSuccess: () => toast.success("Enquiry deleted successfully"),
  deleteError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to delete enquiry"),

  statusUpdateSuccess: () => toast.success("Status updated successfully"),
  statusUpdateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update status"),
};

// Financing / Bank Funding
export const financingToasts = {
  createSuccess: () => toast.success("Financing scheme added successfully"),
  createError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to add financing scheme"),

  updateSuccess: () => toast.success("Financing scheme updated successfully"),
  updateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update financing scheme"),

  deleteSuccess: () => toast.success("Financing scheme deleted successfully"),
  deleteError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to delete financing scheme"),

  setPreferredSuccess: () => toast.success("Preferred scheme updated successfully"),
  setPreferredError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update preferred scheme"),

  loadLendersError: () => toast.error("Failed to load lenders"),
};

// Trade-in Appraisal
export const tradeInToasts = {
  createSuccess: () => toast.success("Trade-in appraisal created successfully"),
  createError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to create appraisal"),

  updateSuccess: () => toast.success("Trade-in appraisal updated successfully"),
  updateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update appraisal"),

  deleteSuccess: () => toast.success("Trade-in appraisal deleted successfully"),
  deleteError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to delete appraisal"),

  requestSent: () => toast.success("Appraisal request sent successfully"),
  requestError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to send appraisal request"),
};

// Test Drive Bookings
export const testDriveToasts = {
  createSuccess: () => toast.success("Test drive booking created successfully"),
  createError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to create booking"),

  updateSuccess: () => toast.success("Test drive booking updated successfully"),
  updateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update booking"),

  deleteSuccess: () => toast.success("Test drive booking cancelled successfully"),
  deleteError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to cancel booking"),

  conflictError: () => toast.error("This time slot is already booked"),

  statusUpdateSuccess: () => toast.success("Booking status updated successfully"),
  statusUpdateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update booking status"),
};

// Vehicle Inventory
export const vehicleToasts = {
  loadError: () => toast.error("Failed to load vehicle inventory"),

  updateSuccess: () => toast.success("Vehicle updated successfully"),
  updateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update vehicle"),
};

// Customers
export const customerToasts = {
  searchError: () => toast.error("Failed to search customers"),

  loadDetailsError: () => toast.error("Failed to load customer details"),

  updateSuccess: () => toast.success("Customer updated successfully"),
  updateError: (error?: any) =>
    toast.error(error?.response?.data?.message || "Failed to update customer"),
};

// ============================================================================
// Generic Toast Helpers
// ============================================================================

export const genericToasts = {
  success: (message: string) => toast.success(message),

  error: (message: string) => toast.error(message),

  loading: (message: string) => toast.loading(message),

  info: (message: string) => toast.info(message),

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => toast.promise(promise, { loading, success, error }),
};
