"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// Type Definitions
// ============================================================================

export interface DeleteConfirmationDialogProps {
  /** Dialog open state */
  open: boolean;

  /** Dialog open state change handler */
  onOpenChange: (open: boolean) => void;

  /** Confirmation handler */
  onConfirm: () => void;

  /** Entity name being deleted (e.g., "enquiry", "test drive booking") */
  entityName?: string;

  /** Custom title */
  title?: string;

  /** Custom description */
  description?: string;

  /** Custom confirm button text */
  confirmText?: string;

  /** Custom cancel button text */
  cancelText?: string;

  /** Loading state */
  isDeleting?: boolean;
}

// ============================================================================
// DeleteConfirmationDialog Component
// ============================================================================

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  entityName = "item",
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const defaultTitle = "Are you sure?";
  const defaultDescription = `This will delete the ${entityName}. This action cannot be undone.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title || defaultTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
