'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

export interface AIEvaluateButtonProps {
  taskId: string;
  isLoading?: boolean;
  onEvaluate: (taskId: string) => void;
  className?: string;
}

export const AIEvaluateButton = ({
  taskId,
  isLoading = false,
  onEvaluate,
  className,
}: AIEvaluateButtonProps) => {
  const handleClick = () => {
    if (!isLoading) {
      onEvaluate(taskId);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={cn('flex items-center gap-2', className)}
      variant="default"
      aria-label="Đánh giá AI cho nhiệm vụ"
    >
      <Bot className="size-4" />
      {isLoading ? 'Đang đánh giá...' : 'Đánh giá AI'}
    </Button>
  );
};
