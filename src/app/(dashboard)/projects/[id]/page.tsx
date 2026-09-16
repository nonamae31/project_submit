import { KanbanBoard } from '@/components/features/kanban/KanbanBoard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KnowledgeTreeClient } from '@/components/features/knowledge/KnowledgeTreeClient';

export default async function ProjectBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white text-zinc-950 dark:bg-black dark:text-zinc-50">
      <Tabs defaultValue="kanban" className="flex flex-col h-full w-full">
        <div className="px-4 py-2 border-b shrink-0">
          <TabsList>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="knowledge">Cây kiến thức</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="kanban" className="flex-1 overflow-hidden m-0 p-0 border-none data-[state=active]:flex data-[state=active]:flex-col">
          <KanbanBoard projectId={id} />
        </TabsContent>
        
        <TabsContent value="knowledge" className="flex-1 overflow-hidden m-0 p-0 border-none data-[state=active]:flex data-[state=active]:flex-col">
          <KnowledgeTreeClient projectId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
