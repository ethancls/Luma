"use client";

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="error">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-1">{message}</AlertDescription>
      {onRetry && (
        <Button variant="destructive-outline" size="sm" onClick={onRetry} className="mt-3">
          Try again
        </Button>
      )}
    </Alert>
  );
}
