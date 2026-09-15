import { create } from 'zustand';
import type { Task, Column } from '@/types/kanban.types';

interface KanbanStore {
  columns: Column[];
  tasks: Task[];
  setColumns: (columns: Column[]) => void;
  addColumn: (column: Column) => void;
  updateColumn: (column: Column) => void;
  removeColumn: (columnId: string) => void;
  setTasks: (tasks: Task[]) => void;
  moveTask: (taskId: string, newColumnId: string) => void;
  updateTaskFile: (taskId: string, fileUrl: string, fileName: string) => void;
  updateTaskAssignee: (taskId: string, assignee: string) => void;
  addTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  updateTask: (task: Task) => void;
}

export const useKanbanStore = create<KanbanStore>((set) => ({
  columns: [],
  tasks: [],
  setColumns: (columns) => set({ columns }),
  addColumn: (column) => set((state) => ({ columns: [...state.columns, column] })),
  updateColumn: (updatedColumn) =>
    set((state) => ({
      columns: state.columns.map((col) => (col.id === updatedColumn.id ? updatedColumn : col)),
    })),
  removeColumn: (columnId) =>
    set((state) => ({
      columns: state.columns.filter((col) => col.id !== columnId),
    })),
  setTasks: (tasks) => set({ tasks }),
  moveTask: (taskId, newColumnId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, column_id: newColumnId } : task
      ),
    })),
  updateTaskFile: (taskId, fileUrl, fileName) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, attachedFileUrl: fileUrl, attachedFileName: fileName } : task
      ),
    })),
  updateTaskAssignee: (taskId, assignee) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, assignee } : task
      ),
    })),
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      ),
    })),
}));
