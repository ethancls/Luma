import { Empty } from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Empty>
      <h3 className="text-lg font-semibold text-zinc-400">{title}</h3>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
      {action && (
        <Button variant="outline" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Empty>
  );
}
