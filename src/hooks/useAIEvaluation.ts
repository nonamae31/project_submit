'use client';

import { useCompletion } from '@ai-sdk/react';
import { useCallback } from 'react';

export const useAIEvaluation = (onEvaluationComplete?: (summary: string) => void) => {
  const { completion, complete, isLoading, error } = useCompletion({
    api: '/api/ai-evaluate',
    onFinish: (_prompt: string, result: string) => {
      onEvaluationComplete?.(result);
    },
  });

  const evaluateTask = useCallback((taskId: string) => {
    complete(taskId);
  }, [complete]);

  return { completion, evaluateTask, isLoading, error };
};
