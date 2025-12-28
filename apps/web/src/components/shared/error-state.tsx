/**
 * ErrorState Component
 *
 * A consistent error state component with optional retry button.
 * Used across the application to display errors in a user-friendly way.
 */

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  /**
   * Error title
   * @default "Error"
   */
  title?: string;

  /**
   * Error message to display
   */
  message: string;

  /**
   * Optional retry callback
   */
  onRetry?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Displays a centered error message with optional retry button
 *
 * @example
 * <ErrorState message="Failed to load data" />
 * <ErrorState
 *   title="Something went wrong"
 *   message="Failed to load quotations"
 *   onRetry={() => refetch()}
 * />
 */
export function ErrorState({
  title = 'Error',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center gap-4 ${className}`}
    >
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold text-destructive">{title}</h2>
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
