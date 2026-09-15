import type { Board } from '@/types/board.types';
import { BoardFilter } from './BoardFilter';

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {board.title}
      </h1>
      <BoardFilter />
    </div>
  );
}
