'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@/types/kanban.types';
import { cn } from '@/lib/utils';
import { Paperclip } from 'lucide-react';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { supabase } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { stripHtmlTags } from '@/utils/stringUtils';

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

  let assigneeInitials = '?';
  if (task.assignee) {
    if (task.assignee.includes('@')) {
      assigneeInitials = task.assignee.substring(0, 2).toUpperCase();
    } else {
      const parts = task.assignee.split(' ').filter(Boolean);
      if (parts.length >= 2) {
        assigneeInitials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      } else {
        assigneeInitials = task.assignee.substring(0, 2).toUpperCase();
      }
    }
  }

  const handleMove = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newColumnId = e.target.value;
    if (newColumnId === task.column_id) return;

    // Optimistic Update
    moveTask(task.id, newColumnId);

    // DB update
    await supabase.from('tasks').update({ column_id: newColumnId }).eq('id', task.id);
  };

  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => setIsMounted(true), []);

  const cleanDescription = React.useMemo(() => {
    if (!task.description) return '';
    // Fix Hydration Mismatch: Render same as SSR on first pass
    if (!isMounted) return task.description.replace(/<[^>]*>?/gm, '');
    return stripHtmlTags(task.description);
  }, [task.description, isMounted]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      aria-label={`Task: ${task.title}`}
      className={cn(
        'group flex flex-col gap-2 rounded-lg border p-3 transition-all cursor-pointer hover:ring-1 hover:ring-primary/50 hover:shadow-md',
        isDragging 
          ? 'opacity-80 ring-2 ring-primary/50 bg-muted/80 shadow-lg' 
          : 'bg-white shadow-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{task.title}</h4>
        
      </div>
      
      {/* E4: Contrast Dark mode, E7: Empty state */}
      {cleanDescription ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {cleanDescription}
        </p>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
          Không có mô tả
        </p>
      )}
      
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
          aria-label="Move task to column"
          className="text-xs border rounded p-1 bg-transparent w-full text-zinc-600 dark:text-zinc-400 dark:border-zinc-700"
        >
          <option value="" disabled>Move to...</option>
          {columns.map(col => (
            <option key={col.id} value={col.id}>{col.title}</option>
          ))}
        </select>
      </div>

      {task.assignee && (
        <div className="mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-2 flex items-center">
          {/* E1: Tooltip Assignee */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help" onClick={(e) => e.stopPropagation()}>
                  {/* E3: Responsive Assignee (hidden md:inline) */}
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden md:inline">Phụ trách:</span>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assignee_avatar_url} alt={task.assignee} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{assigneeInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{task.assignee}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Người phụ trách: {task.assignee}</p>
                {task.assignee_email && <p className="text-xs text-zinc-400">{task.assignee_email}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
};
