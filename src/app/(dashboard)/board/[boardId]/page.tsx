import { getBoard } from '@/lib/actions/board.actions';
import { getColumns } from '@/lib/actions/column.actions';
import { BoardHeader } from '@/components/features/board/BoardHeader';
import { BoardActions } from '@/components/features/board/BoardActions';
import { ColumnView } from '@/components/features/board/ColumnView';
import { notFound } from 'next/navigation';

interface BoardPageProps {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { boardId } = await params;
  const resolvedSearchParams = await searchParams;
  
  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search.toLowerCase() : '';

  const [board, allColumns] = await Promise.all([
    getBoard(boardId),
    getColumns(boardId)
  ]);

  if (!board) {
    notFound();
  }

  const columns = allColumns.filter((col) => 
    col.title.toLowerCase().includes(search)
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-slate-950">
      <BoardHeader board={board} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {columns.length} of {allColumns.length} columns
          </p>
          <BoardActions boardId={boardId} />
        </div>
        
        <div className="flex-1 overflow-x-auto p-6 pt-0">
          <div className="flex h-full items-start gap-4">
            {columns.map((col) => (
              <ColumnView key={col.id} column={col} />
            ))}
            
            {columns.length === 0 && (
              <div className="flex w-full items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {search ? 'No columns match your search.' : 'No columns in this board.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
