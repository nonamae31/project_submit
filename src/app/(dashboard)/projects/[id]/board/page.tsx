import { KanbanBoard } from '@/components/features/kanban/KanbanBoard';

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <KanbanBoard projectId={id} />
    </div>
  );
}
