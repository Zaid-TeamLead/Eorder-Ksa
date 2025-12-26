/**
 * Entity Modal State Management Hook
 *
 * This hook manages the state for create/edit/view/delete modals/dialogs.
 * It consolidates multiple useState variables into a single hook.
 *
 * Benefits:
 * - Reduces 7-8 state variables to 1 hook call
 * - Consistent modal management pattern
 * - Type-safe entity handling
 * - Clear separation of modal modes
 *
 * @example
 * ```tsx
 * const modal = useEntityModal<SalesEnquiry>();
 *
 * // Open create dialog
 * modal.openCreate();
 *
 * // Open edit dialog
 * modal.openEdit(enquiry);
 *
 * // Open view dialog
 * modal.openView(enquiry);
 *
 * // Open delete confirmation
 * modal.openDelete(enquiryId);
 *
 * // Close any dialog
 * modal.close();
 *
 * // Check current mode
 * if (modal.isCreateMode) { ... }
 * if (modal.isEditMode) { ... }
 * ```
 */

import { useState, useMemo } from "react";
import type { EntityModalReturn, ModalMode } from "@/types/common";

export function useEntityModal<T>(): EntityModalReturn<T> {
  const [mode, setMode] = useState<ModalMode>(null);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const isOpen = mode !== null;

  const openCreate = () => {
    setMode("create");
    setSelectedEntity(null);
    setDeleteId(null);
  };

  const openEdit = (entity: T) => {
    setMode("edit");
    setSelectedEntity(entity);
    setDeleteId(null);
  };

  const openView = (entity: T) => {
    setMode("view");
    setSelectedEntity(entity);
    setDeleteId(null);
  };

  const openDelete = (id: number) => {
    setMode("delete");
    setDeleteId(id);
    setSelectedEntity(null);
  };

  const close = () => {
    setMode(null);
    setSelectedEntity(null);
    setDeleteId(null);
  };

  const helpers = useMemo(
    () => ({
      isCreateMode: mode === "create",
      isEditMode: mode === "edit",
      isViewMode: mode === "view",
      isDeleteMode: mode === "delete",
    }),
    [mode]
  );

  return {
    mode,
    isOpen,
    selectedEntity,
    deleteId,
    openCreate,
    openEdit,
    openView,
    openDelete,
    close,
    ...helpers,
  };
}
