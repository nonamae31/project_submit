'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addColumn } from '@/lib/actions/column.actions';

interface BoardActionsProps {
  boardId: string;
}

export function BoardActions({ boardId }: BoardActionsProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddColumn = async () => {
    setIsAdding(true);
    try {
      await addColumn(boardId, 'New Column');
    } catch (error) {
      console.error('Failed to add column', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        onClick={handleAddColumn} 
        disabled={isAdding}
        variant="default"
        size="sm"
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        <span>Add Column</span>
      </Button>
    </div>
  );
}
