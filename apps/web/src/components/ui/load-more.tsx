import { Button } from './button';
import { Spinner } from './spinner';

interface LoadMoreProps {
  hasMore: boolean;
  isLoading: boolean;
  onClick: () => void;
  label?: string;
}

export const LoadMore = ({
  hasMore,
  isLoading,
  onClick,
  label = 'Load more',
}: LoadMoreProps) => {
  if (!hasMore) {
    return null;
  }

  return (
    <div className="flex justify-center pt-5">
      <Button variant="secondary" size="sm" onClick={onClick} disabled={isLoading}>
        {isLoading ? <Spinner /> : label}
      </Button>
    </div>
  );
};
