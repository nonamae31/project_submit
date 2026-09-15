'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, BoardColumnType } from '@/types/kanban.types';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { useKanbanStore } from '@/stores/useKanbanStore';

interface BoardColumnProps {
  column: BoardColumnType;
  onTaskClick: (task: Task) => void;
}

export const BoardColumn = ({ column, onTaskClick }: BoardColumnProps) => {
  const { updateColumn, removeColumn } = useKanbanStore();

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  const taskIds = column.tasks.map((t) => t.id);

  const handleEdit = async () => {
    const newTitle = prompt('Nhập tên cột mới:', column.title);
    if (!newTitle || newTitle === column.title) return;
    
    // Optimistic
    updateColumn({ ...column, title: newTitle });
    
    await supabase.from('columns').update({ title: newTitle }).eq('id', column.id);
  };

  const handleDelete = async () => {
    if (column.tasks.length > 0) {
      alert('Không thể xóa cột có chứa task!');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa cột này?')) return;
    
    // Optimistic
    removeColumn(column.id);
    
    await supabase.from('columns').delete().eq('id', column.id);
  };

  return (
    <div className="flex h-full min-h-[500px] w-80 flex-col rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900 group shrink-0">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{column.title}</h3>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium dark:bg-zinc-800">
            {column.tasks.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleEdit}
            className="p-1 text-xs text-zinc-500 hover:text-blue-500"
            title="Sửa cột"
          >
            ✏️
          </button>
          <button 
            onClick={handleDelete}
            className="p-1 text-xs text-zinc-500 hover:text-red-500"
            title="Xóa cột"
          >
            🗑️
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-1 flex-col gap-3 rounded-lg p-1 transition-colors',
          isOver ? 'bg-primary/10 ring-2 ring-primary/50' : 'bg-transparent'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};
