'use client';

import { cn } from '@/lib/utils';
import { BotMessageSquare, AlertCircle } from 'lucide-react';

export interface AISummaryPanelProps {
  summary: string;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
}

export const AISummaryPanel = ({ summary, isLoading, error, className }: AISummaryPanelProps) => {
  if (!summary && !isLoading && !error) return null;

  return (
    <div 
      className={cn(
        'mt-4 rounded-lg border bg-card p-5 text-card-foreground shadow-sm transition-colors', 
        'dark:border-border dark:bg-card',
        className
      )}
      role="region"
      aria-label="AI Evaluation Summary"
    >
      <div className="mb-3 flex items-center gap-2">
        <BotMessageSquare className="size-5 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-semibold text-foreground">Đánh giá từ AI</h3>
      </div>
      
      {error && (
        <div className="mb-2 flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="size-4" />
          <span>Có lỗi xảy ra khi lấy đánh giá từ AI. Vui lòng thử lại.</span>
        </div>
      )}

      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div 
          className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap", 
            isLoading && "animate-pulse opacity-80"
          )}
          aria-live="polite"
          aria-busy={isLoading}
        >
          {summary || (isLoading ? 'AI đang phân tích...' : '')}
        </div>
      </div>
    </div>
  );
};
