import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { KnowledgeNode } from '@/types/knowledge.types';
import { Plus, Edit, Upload, Trash } from 'lucide-react';

type CustomNodeProps = {
  data: {
    node: KnowledgeNode;
    onViewMedia: (node: KnowledgeNode) => void;
    onDelete: (id: string) => void;
    onAddChild: (parentId: string) => void;
    onEdit: (node: KnowledgeNode) => void;
    onUploadMedia: (node: KnowledgeNode) => void;
  };
};

export function CustomNode({ data }: CustomNodeProps) {
  const { node, onViewMedia, onDelete, onAddChild, onEdit, onUploadMedia } = data;

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-950 p-4 shadow-sm min-w-[250px] border-zinc-200 dark:border-zinc-800">
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-semibold text-sm line-clamp-2">{node.title}</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => onDelete(node.id)}>
            <span className="sr-only">Delete</span>
            <Trash className="w-3 h-3" />
          </Button>
        </div>
        {node.description && <p className="text-xs text-zinc-500 line-clamp-2">{node.description}</p>}
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
            {node.progress}%
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddChild(node.id)} title="Thêm Node Con">
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(node)} title="Chỉnh Sửa Node">
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUploadMedia(node)} title="Upload Media">
              <Upload className="w-3 h-3" />
            </Button>
          </div>
        </div>
        {node.media_files && node.media_files.length > 0 && (
          <Button variant="outline" size="sm" className="h-6 text-xs px-2 mt-2 w-full" onClick={() => onViewMedia(node)}>
            Xem {node.media_files.length} Media
          </Button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
}
