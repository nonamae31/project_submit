'use server';

import type { Board } from '@/types/board.types';

const mockBoard: Board = {
  id: 'board-1',
  title: 'Project Alpha',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getBoard(boardId: string): Promise<Board | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (boardId === mockBoard.id) {
    return mockBoard;
  }
  return null;
}
