'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateColumnTitle, deleteColumn } from '@/lib/actions/column.actions';
import type { Column } from '@/types/board.types';

interface ColumnSettingsFormProps {
  column: Column;
  onSuccess?: () => void;
}

export function ColumnSettingsForm({ column, onSuccess }: ColumnSettingsFormProps) {
  const [title, setTitle] = useState(column.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || title === column.title) return;
    
    setIsUpdating(true);
    try {
      await updateColumnTitle(column.id, column.boardId, title);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update column', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this column?')) return;
    
    setIsDeleting(true);
    try {
      await deleteColumn(column.id, column.boardId);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to delete column', error);
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="flex flex-col gap-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Column Title
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUpdating || isDeleting}
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <Button 
          type="button" 
          variant="destructive" 
          size="sm" 
          onClick={handleDelete}
          disabled={isUpdating || isDeleting}
        >
          Delete
        </Button>
        <Button 
          type="submit" 
          size="sm" 
          disabled={isUpdating || isDeleting || title === column.title}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
