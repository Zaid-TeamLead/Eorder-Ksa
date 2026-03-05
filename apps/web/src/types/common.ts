/**
 * Common Type Definitions Shared Across Modules
 */

import type { QueryKey } from "@tanstack/react-query";

// ============================================================================
// Generic CRUD Types
// ============================================================================

export interface CRUDMutationsConfig<
  TCreate,
  TUpdate = Partial<TCreate>,
  TCreateResult = any,
  TUpdateResult = any,
  TDeleteResult = any
> {
  createFn: (data: TCreate) => Promise<TCreateResult>;
  updateFn: (id: number, data: TUpdate) => Promise<TUpdateResult>;
  deleteFn: (id: number) => Promise<TDeleteResult>;
  queryKey: QueryKey;
  entityName: string;
}

export interface CRUDMutationsReturn<
  TCreate,
  TUpdate = Partial<TCreate>,
  TCreateResult = any,
  TUpdateResult = any,
  TDeleteResult = any
> {
  create: (data: TCreate) => Promise<TCreateResult>;
  update: (id: number, data: TUpdate) => Promise<TUpdateResult>;
  delete: (id: number) => Promise<TDeleteResult>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// ============================================================================
// Modal/Dialog Types
// ============================================================================

export type ModalMode = "create" | "edit" | "view" | "delete" | null;

export interface EntityModalState<T> {
  mode: ModalMode;
  isOpen: boolean;
  selectedEntity: T | null;
  deleteId: number | null;
}

export interface EntityModalActions<T> {
  openCreate: () => void;
  openEdit: (entity: T) => void;
  openView: (entity: T) => void;
  openDelete: (id: number) => void;
  close: () => void;
}

export interface EntityModalReturn<T>
  extends EntityModalState<T>,
    EntityModalActions<T> {
  isCreateMode: boolean;
  isEditMode: boolean;
  isViewMode: boolean;
  isDeleteMode: boolean;
}

// ============================================================================
// Form Sync Types
// ============================================================================

export interface FormSyncConfig<T> {
  data: T | undefined;
  form: any; // UseFormReturn from react-hook-form
  transform?: (data: T) => Record<string, any>;
}

// ============================================================================
// Mutation with Toast Types
// ============================================================================

export interface MutationWithToastConfig<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: any) => string);
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: any, variables: TVariables) => void;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}
