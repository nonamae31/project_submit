'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useSearchParams } from 'next/navigation';
import { useKanbanStore } from '@/stores/useKanbanStore';
import type { Task, Column, BoardColumnType } from '@/types/kanban.types';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import FilterToolbar from './FilterToolbar';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { getSessionUser } from '@/app/actions/auth.actions';
import { BoardTour } from './BoardTour';

export const KanbanBoard = ({ projectId }: { projectId?: string }) => {
  const { tasks, setTasks, addTask, updateTask, removeTask, columns: storeColumns, setColumns, addColumn, updateColumn, removeColumn } = useKanbanStore();
  const searchParams = useSearchParams();
  const filterAssignee = searchParams.get('assignee');
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [onlineUsers, setOnlineUsers] = React.useState<any[]>([]);
  const [userEmail, setUserEmail] = React.useState('');

  React.useEffect(() => {
    if (!projectId) return;

    let presenceChannel: any;

    const fetchData = async () => {
      const [columnsRes, tasksRes, userSession] = await Promise.all([
        supabase.from('columns').select('*').eq('project_id', projectId).order('position'),
        supabase.from('tasks').select('*').eq('project_id', projectId).eq('is_deleted', false),
        getSessionUser()
      ]);
      
      if (columnsRes.data && !columnsRes.error) setColumns(columnsRes.data as Column[]);
      if (tasksRes.data && !tasksRes.error) setTasks(tasksRes.data as Task[]);
      if (userSession?.email) setUserEmail(userSession.email);

      // For custom auth, we need to get user from API route or profile, but let's just get session email if we can.
      // Wait, we bypass supabase.auth.getUser() because it's disabled.
      // We should fetch from our custom /api/auth/me or getSessionUser server action.
      // Since it's client component, let's just use a dummy or skip presence if user is not resolved easily here.
      // I'll leave the presence logic ready.
    };

    fetchData();

    // E4: Real-time presence (Mocking userId for now since it's hard to get synchronously without Context)
    const randomId = Math.random().toString(36).substring(7);
    presenceChannel = supabase.channel(`room_${projectId}`, {
      config: { presence: { key: randomId } },
    });

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const users = Object.keys(state).map((key) => state[key][0]);
      setOnlineUsers(users);
    });

    presenceChannel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel.track({ user: 'Anonymous ' + randomId, online_at: new Date().toISOString() });
      }
    });

    const taskChannel = supabase
      .channel('board-tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const stateTasks = useKanbanStore.getState().tasks;
            if (!stateTasks.find((t) => t.id === payload.new.id)) {
              addTask(payload.new as Task);
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_deleted) {
              removeTask(payload.new.id);
            } else {
              updateTask(payload.new as Task);
            }
          } else if (payload.eventType === 'DELETE') {
            removeTask(payload.old.id);
          }
        }
      )
      .subscribe();

    const columnChannel = supabase
      .channel('board-columns')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'columns', filter: `project_id=eq.${projectId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const stateColumns = useKanbanStore.getState().columns;
            if (!stateColumns.find((c) => c.id === payload.new.id)) {
              addColumn(payload.new as Column);
            }
          } else if (payload.eventType === 'UPDATE') {
            updateColumn(payload.new as Column);
          } else if (payload.eventType === 'DELETE') {
            removeColumn(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(columnChannel);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, [projectId, setTasks, addTask, updateTask, removeTask, setColumns, addColumn, updateColumn, removeColumn]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTasks = React.useMemo(() => {
    if (!filterAssignee || filterAssignee === 'all') return tasks;
    if (filterAssignee === 'unassigned') return tasks.filter(t => !t.assignee_email);
    return tasks.filter(t => t.assignee_email === filterAssignee);
  }, [tasks, filterAssignee]);

  const boardColumns = React.useMemo(() => {
    const cols: Record<string, BoardColumnType> = {};
    storeColumns.forEach((col) => {
      cols[col.id] = { ...col, tasks: [] };
    });

    filteredTasks.forEach((task) => {
      if (cols[task.column_id]) {
        cols[task.column_id].tasks.push(task);
      }
    });

    return storeColumns.map((col) => cols[col.id]);
  }, [storeColumns, filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    // Optimistic UI update for moving between columns or sorting
    if (isActiveTask && isOverTask) {
      const activeTaskIndex = tasks.findIndex((t) => t.id === activeId);
      const overTaskIndex = tasks.findIndex((t) => t.id === overId);

      const activeTaskObj = tasks[activeTaskIndex];
      const overTaskObj = tasks[overTaskIndex];

      if (activeTaskObj.column_id !== overTaskObj.column_id) {
        // Moving to a different column
        const newTasks = [...tasks];
        newTasks[activeTaskIndex] = { ...activeTaskObj, column_id: overTaskObj.column_id };
        setTasks(arrayMove(newTasks, activeTaskIndex, overTaskIndex));
      } else {
        // Reordering in the same column
        setTasks(arrayMove(tasks, activeTaskIndex, overTaskIndex));
      }
    }

    if (isActiveTask && isOverColumn) {
      const activeTaskIndex = tasks.findIndex((t) => t.id === activeId);
      const activeTaskObj = tasks[activeTaskIndex];
      const newColumnId = String(overId);

      if (activeTaskObj.column_id !== newColumnId) {
        const newTasks = [...tasks];
        newTasks[activeTaskIndex] = { ...activeTaskObj, column_id: newColumnId };
        setTasks(newTasks);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    
    
    // Lấy column_id mới từ over (tuỳ thuộc logic dnd-kit hiện tại, có thể là over.id hoặc over.data.current)
    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';
    
    let newColumnId = '';
    if (isOverTask) newColumnId = over.data.current?.task.column_id;
    else if (isOverColumn) newColumnId = String(over.id);
    
    if (!newColumnId) return; // fail-safe
    
    console.log('Bắt đầu lưu vị trí mới của task...');
    const { data, error } = await supabase.from('tasks').update({ column_id: newColumnId }).eq('id', active.id).select();
    if (error) {
        console.error("🚨 SUPABASE UPDATE ERROR:", error.message, error.details, error.hint);
        alert("Lỗi lưu DB: " + error.message);
    } else {
        console.log("✅ LƯU THÀNH CÔNG:", data);
    }
  };

  const handleAddColumn = async () => {
    if (!projectId) return;
    const title = prompt('Nhập tên cột mới:');
    if (!title) return;
    
    const newColumn = {
      id: uuidv4(),
      title,
      position: storeColumns.length,
      project_id: projectId
    };
    
    // Optimistic update
    addColumn(newColumn);
    
    // DB update
    const { error } = await supabase.from('columns').insert(newColumn);
    if (error) {
      console.error('Error adding column', error);
      removeColumn(newColumn.id); // Rollback on error
    }
  };

  return (
    <div className="flex h-full w-full">
      <BoardTour />
      {/* Main Board */}
      <div className="flex flex-1 flex-col gap-6 p-8 overflow-hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" id="tour-step-1">Kanban Board</h2>
            <p className="text-zinc-500">Drag and drop tasks to update their status.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* E4: Realtime Presence */}
            <div className="flex items-center -space-x-2" title={`${onlineUsers.length} người đang xem`}>
              {onlineUsers.slice(0, 3).map((user, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-xs text-white uppercase font-bold shadow-sm z-10" style={{ zIndex: 10 - i }}>
                  {user.user ? user.user.substring(10, 12) : 'A'}
                </div>
              ))}
              {onlineUsers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-xs font-bold z-0">
                  +{onlineUsers.length - 3}
                </div>
              )}
            </div>
            
            <button
              onClick={handleAddColumn}
              className="rounded-md bg-zinc-100 px-4 py-2 font-medium text-zinc-900 shadow-sm hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              + Thêm Cột
            </button>
            <button
              id="tour-step-3"
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
            >
              Create Task
            </button>
          </div>
        </div>

        <FilterToolbar tasks={tasks} currentUserEmail={userEmail} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {filterAssignee && filterAssignee !== 'all' && filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            Thành viên này hiện tại chưa có công việc nào.
          </div>
        ) : (
          <div className="flex flex-1 gap-6 overflow-x-auto pb-4" id="tour-step-2">
            {boardColumns.map((col) => (
              <BoardColumn 
                key={col.id} 
                column={col} 
                onTaskClick={setSelectedTask} 
              />
            ))}
          </div>
        )}

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />

        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={projectId || null}
          defaultAssignee={filterAssignee || undefined}
        />
      </div>
    </div>
  );
};
