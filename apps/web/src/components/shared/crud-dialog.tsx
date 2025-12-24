"use client";

import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Mode of the CRUD dialog
 */
export type CrudMode = "create" | "edit" | "view";

/**
 * Configuration for multi-step forms
 */
export interface MultiStepConfig {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Handler for previous step */
  onPrevious?: () => void;
  /** Handler for next step */
  onNext?: () => void;
  /** Custom labels for steps (optional) */
  stepLabels?: string[];
}

/**
 * Props for action buttons
 */
export interface ActionButton {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "destructive";
  /** Button size */
  size?: "default" | "sm" | "lg";
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Props for CrudDialog component
 */
export interface CrudDialogProps {
  /** Dialog open state */
  open: boolean;

  /** Dialog open state change handler */
  onOpenChange: (open: boolean) => void;

  /** CRUD mode */
  mode: CrudMode;

  /** Entity name (e.g., "Sales Enquiry", "Test Drive") */
  entityName: string;

  /** Dialog content */
  children: React.ReactNode;

  /** Submit handler */
  onSubmit?: () => void;

  /** Submit button label (default: "Save" for create, "Update" for edit) */
  submitLabel?: string;

  /** Submit button loading state */
  isSubmitting?: boolean;

  /** Multi-step configuration (optional) */
  multiStepConfig?: MultiStepConfig;

  /** Custom action buttons (replaces default submit/cancel) */
  customActions?: ActionButton[];

  /** Description text */
  description?: string;

  /** Custom dialog content class */
  contentClassName?: string;

  /** Custom dialog header class */
  headerClassName?: string;

  /** Custom dialog footer class */
  footerClassName?: string;

  /** Hide default footer */
  hideFooter?: boolean;

  /** Show close button in header */
  showCloseButton?: boolean;

  /** Custom title (overrides auto-generated title) */
  customTitle?: string;
}

// ============================================================================
// CrudDialog Component
// ============================================================================

export function CrudDialog({
  open,
  onOpenChange,
  mode,
  entityName,
  children,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  multiStepConfig,
  customActions,
  description,
  contentClassName,
  headerClassName,
  footerClassName,
  hideFooter = false,
  showCloseButton = true,
  customTitle,
}: CrudDialogProps) {
  // Generate title based on mode
  const getTitle = () => {
    if (customTitle) return customTitle;

    switch (mode) {
      case "create":
        return `Create ${entityName}`;
      case "edit":
        return `Edit ${entityName}`;
      case "view":
        return `View ${entityName}`;
      default:
        return entityName;
    }
  };

  // Generate submit button label
  const getSubmitLabel = () => {
    if (submitLabel) return submitLabel;

    switch (mode) {
      case "create":
        return "Save changes";
      case "edit":
        return "Update";
      default:
        return "OK";
    }
  };

  // Check if on last step for multi-step forms
  const isLastStep = multiStepConfig
    ? multiStepConfig.currentStep === multiStepConfig.totalSteps - 1
    : true;

  // Check if on first step for multi-step forms
  const isFirstStep = multiStepConfig ? multiStepConfig.currentStep === 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          contentClassName ||
          "max-h-[calc(100vh-2rem)] w-full h-full flex flex-col sm:max-w-7xl p-0 gap-0"
        }
      >
        {/* Header */}
        <DialogHeader className={headerClassName || "px-6 pt-6 pb-4 border-b"}>
          <DialogTitle className="text-xl font-semibold">
            {getTitle()}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>

        {/* Footer */}
        {!hideFooter && (
          <DialogFooter
            className={
              footerClassName ||
              "mt-auto border-t px-6 py-3 flex items-center justify-between bg-muted/30"
            }
          >
            {/* Multi-step navigation */}
            {multiStepConfig && (
              <div className="flex gap-2">
                {!isFirstStep && multiStepConfig.onPrevious && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={multiStepConfig.onPrevious}
                    className="h-8"
                    disabled={isSubmitting}
                  >
                    Previous
                  </Button>
                )}
                {!isLastStep && multiStepConfig.onNext && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={multiStepConfig.onNext}
                    className="h-8"
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                )}
              </div>
            )}

            {!multiStepConfig && <div />} {/* Spacer for single-step */}

            {/* Action buttons */}
            <div className="flex gap-2">
              {customActions ? (
                // Render custom actions
                customActions.map((action, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={action.variant || "default"}
                    size={action.size || "sm"}
                    onClick={action.onClick}
                    disabled={action.disabled || action.isLoading}
                    className="h-8"
                  >
                    {action.isLoading ? "Loading..." : action.label}
                  </Button>
                ))
              ) : (
                // Default actions
                <>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  {(!multiStepConfig || isLastStep) && onSubmit && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      onClick={onSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving..." : getSubmitLabel()}
                    </Button>
                  )}
                </>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
