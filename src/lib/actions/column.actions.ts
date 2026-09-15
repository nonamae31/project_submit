'use server';

import type { Column } from '@/types/board.types';
import { revalidatePath } from 'next/cache';

// Mock DB
let mockColumns: Column[] = [
  { id: 'col-1', boardId: 'board-1', title: 'To Do', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'col-2', boardId: 'board-1', title: 'In Progress', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'col-3', boardId: 'board-1', title: 'Done', order: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export async function getColumns(boardId: string): Promise<Column[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockColumns.filter(c => c.boardId === boardId).sort((a, b) => a.order - b.order);
}

export async function addColumn(boardId: string, title: string): Promise<Column> {
  const newCol: Column = {
    id: `col-${Date.now()}`,
    boardId,
    title,
    order: mockColumns.filter(c => c.boardId === boardId).length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockColumns.push(newCol);
  revalidatePath(`/board/${boardId}`);
  return newCol;
}

export async function deleteColumn(columnId: string, boardId: string): Promise<void> {
  mockColumns = mockColumns.filter(c => c.id !== columnId);
  revalidatePath(`/board/${boardId}`);
}

export async function updateColumnTitle(columnId: string, boardId: string, title: string): Promise<void> {
  const column = mockColumns.find(c => c.id === columnId);
  if (column) {
    column.title = title;
    column.updatedAt = new Date().toISOString();
  }
  revalidatePath(`/board/${boardId}`);
}
