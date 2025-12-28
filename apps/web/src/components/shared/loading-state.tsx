/**
 * LoadingState Component
 *
 * A consistent loading state component used across the application.
 * Replaces duplicate loading states in 4+ pages.
 */

import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /**
   * Custom message to display below the spinner
   * @default "Loading..."
   */
  message?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Displays a centered loading spinner with optional message
 *
 * @example
 * <LoadingState />
 * <LoadingState message="Loading quotations..." />
 * <LoadingState message="Please wait..." className="min-h-[400px]" />
 */
export function LoadingState({
  message = 'Loading...',
  className = '',
}: LoadingStateProps) {
  return (
    <div className={`flex min-h-screen items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
