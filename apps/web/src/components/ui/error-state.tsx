import { Button } from './button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  message = 'Something went wrong loading this.',
  onRetry,
}: ErrorStateProps) => (
  <div className="rounded-xl border border-danger/40 bg-danger-soft px-5 py-6 text-center">
    <p className="text-sm text-danger">{message}</p>
    {onRetry ? (
      <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
);
