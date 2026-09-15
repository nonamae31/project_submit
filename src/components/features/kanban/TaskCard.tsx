'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/kanban.types';
import { cn } from '@/lib/utils';
import { Paperclip } from 'lucide-react';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { supabase } from '@/lib/supabase/client';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const { columns, moveTask } = useKanbanStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assigneeInitials = task.assignee
    ? task.assignee.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  const handleMove = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newColumnId = e.target.value;
    if (newColumnId === task.column_id) return;

    // Optimistic Update
    moveTask(task.id, newColumnId);

    // DB update
    await supabase.from('tasks').update({ column_id: newColumnId }).eq('id', task.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={cn(
        'group flex flex-col gap-2 rounded-lg border p-3 transition-all cursor-pointer hover:ring-1 hover:ring-primary/50 hover:shadow-md',
        isDragging 
          ? 'opacity-80 ring-2 ring-primary/50 bg-muted/80 shadow-lg' 
          : 'bg-white shadow-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-sm font-medium">{task.title}</h4>
        {task.assignee && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary" title={task.assignee}>
            {assigneeInitials}
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
        {task.description}
      </p>
      
      {task.attachedFileName && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-500">
          <Paperclip className="h-3 w-3" />
          <span className="truncate">{task.attachedFileName}</span>
        </div>
      )}

      <div 
        className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <select 
          value={task.column_id} 
          onChange={handleMove}
          className="text-xs border rounded p-1 bg-transparent w-full text-zinc-600 dark:text-zinc-400 dark:border-zinc-700"
        >
          <option value="" disabled>Move to...</option>
          {columns.map(col => (
            <option key={col.id} value={col.id}>{col.title}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
