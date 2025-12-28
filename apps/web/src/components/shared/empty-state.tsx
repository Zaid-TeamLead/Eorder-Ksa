/**
 * EmptyState Component
 *
 * A consistent empty state component with optional icon and action button.
 * Used across the application when no data is available.
 */

import { ReactNode } from 'react';

interface EmptyStateProps {
  /**
   * Optional icon to display above the title
   */
  icon?: ReactNode;

  /**
   * Title text
   */
  title: string;

  /**
   * Optional description text
   */
  description?: string;

  /**
   * Optional action button or element
   */
  action?: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Displays a centered empty state with optional icon, description, and action
 *
 * @example
 * <EmptyState
 *   title="No quotations found"
 *   description="Create your first quotation to get started"
 * />
 *
 * @example
 * <EmptyState
 *   icon={<FileText className="h-12 w-12" />}
 *   title="No quotations found"
 *   action={<Button>Create Quotation</Button>}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`py-12 text-center ${className}`}>
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p className="text-lg font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
