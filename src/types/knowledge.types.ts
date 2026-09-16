export interface KnowledgeNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  progress: number;
  media_files: any[];
  created_at?: string;
}
