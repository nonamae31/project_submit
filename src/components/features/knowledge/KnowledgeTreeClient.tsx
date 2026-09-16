'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node as FlowNode,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { supabase } from '@/lib/supabase/client';
import { KnowledgeNode } from '@/types/knowledge.types';
import { CustomNode } from './CustomNode';
import { recursiveDeleteNodeAction, createKnowledgeNode, uploadMediaNodeAction, updateKnowledgeNodeAction } from '@/actions/knowledge.actions';

import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const nodeTypes = {
  custom: CustomNode,
};

const getLayoutedElements = (nodes: FlowNode[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - 250 / 2,
      y: nodeWithPosition.y - 120 / 2,
    };
  });

  return { nodes, edges };
};

// Hook for window width
function useWindowWidth() {
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

function FlowComponent({
  knowledgeNodes,
  onDeleteNode,
  onViewMedia,
  onAddChild,
  onEdit,
  onUploadMedia,
  onAddRoot
}: {
  knowledgeNodes: KnowledgeNode[];
  onDeleteNode: (id: string) => void;
  onViewMedia: (node: KnowledgeNode) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (node: KnowledgeNode) => void;
  onUploadMedia: (node: KnowledgeNode) => void;
  onAddRoot: () => void;
}) {
  const { setCenter, fitView, getNodes } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const initialNodes: FlowNode[] = knowledgeNodes.map((kn) => ({
      id: kn.id,
      type: 'custom',
      position: { x: 0, y: 0 },
      data: { node: kn, onViewMedia, onDelete: onDeleteNode, onAddChild, onEdit, onUploadMedia },
    }));

    const initialEdges: Edge[] = knowledgeNodes
      .filter((kn) => kn.parent_id)
      .map((kn) => ({
        id: `e-${kn.parent_id}-${kn.id}`,
        source: kn.parent_id!,
        target: kn.id,
        type: 'smoothstep',
        animated: true,
      }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [knowledgeNodes, onViewMedia, onDeleteNode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const currentNodes = getNodes();
    const foundNode = currentNodes.find((n) => 
      (n.data.node as KnowledgeNode).title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundNode) {
      setCenter(foundNode.position.x + 125, foundNode.position.y + 60, { zoom: 1.5, duration: 800 });
    }
  };

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-center" className="bg-white/90 dark:bg-black/90 p-2 rounded-lg shadow-md border backdrop-blur-sm">
          <div className="flex gap-2 items-center">
            <Button type="button" variant="default" size="sm" className="h-9 mr-4" onClick={onAddRoot}>
              Tạo Root Node
            </Button>
            <form onSubmit={handleSearch} className="flex gap-2 items-center">
              <Input 
                placeholder="Tìm kiếm node..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-9"
              />
              <Button type="submit" size="sm" className="h-9">Tìm</Button>
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => fitView({ duration: 800 })}>
                Reset View
              </Button>
            </form>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function KnowledgeTreeClient({ projectId }: { projectId: string }) {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMediaNode, setSelectedMediaNode] = useState<KnowledgeNode | null>(null);
  
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [nodeModalMode, setNodeModalMode] = useState<'create' | 'edit'>('create');
  const [nodeModalParentId, setNodeModalParentId] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null);
  const [nodeFormData, setNodeFormData] = useState({ title: '', description: '', progress: 0 });
  const [isSubmittingNode, setIsSubmittingNode] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadNode, setUploadNode] = useState<KnowledgeNode | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const windowWidth = useWindowWidth();

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching knowledge nodes:', error);
    } else {
      setNodes(data || []);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa Node này và tất cả Node con?')) return;
    
    const removeIds = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      removeIds.add(current);
      const children = nodes.filter(n => n.parent_id === current);
      queue.push(...children.map(c => c.id));
    }
    
    const previousNodes = [...nodes];
    setNodes(nodes.filter(n => !removeIds.has(n.id)));

    const result = await recursiveDeleteNodeAction(id);
    if (!result.success) {
      setNodes(previousNodes);
      alert('Failed to delete node');
    }
  };

  const handleAddChild = (parentId: string | null) => {
    setNodeModalMode('create');
    setNodeModalParentId(parentId);
    setNodeFormData({ title: '', description: '', progress: 0 });
    setIsNodeModalOpen(true);
  };

  const handleEditNode = (node: KnowledgeNode) => {
    setNodeModalMode('edit');
    setEditingNode(node);
    setNodeFormData({ title: node.title, description: node.description || '', progress: node.progress || 0 });
    setIsNodeModalOpen(true);
  };

  const handleSubmitNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNode(true);
    
    if (nodeModalMode === 'create') {
      const res = await createKnowledgeNode({
        project_id: projectId,
        parent_id: nodeModalParentId,
        title: nodeFormData.title,
        description: nodeFormData.description,
        progress: nodeFormData.progress,
      });
      if (res.success && res.data) {
        setNodes([...nodes, res.data]);
        setIsNodeModalOpen(false);
      } else {
        alert('Lỗi tạo node: ' + res.error);
      }
    } else if (nodeModalMode === 'edit' && editingNode) {
      const res = await updateKnowledgeNodeAction(editingNode.id, {
        title: nodeFormData.title,
        description: nodeFormData.description,
        progress: nodeFormData.progress,
      });
      if (res.success && res.data) {
        setNodes(nodes.map(n => n.id === editingNode.id ? res.data : n));
        setIsNodeModalOpen(false);
      } else {
        alert('Lỗi cập nhật node: ' + res.error);
      }
    }
    
    setIsSubmittingNode(false);
  };

  const handleOpenUpload = (node: KnowledgeNode) => {
    setUploadNode(node);
    setIsUploadModalOpen(true);
  };

  const handleUploadMedia = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadNode) return;
    setIsUploading(true);

    const formData = new FormData(e.currentTarget);
    const res = await uploadMediaNodeAction(formData);
    if (res.success && res.data) {
      const newMediaList = [...(uploadNode.media_files || []), res.data];
      const updateRes = await updateKnowledgeNodeAction(uploadNode.id, { media_files: newMediaList });
      if (updateRes.success && updateRes.data) {
        setNodes(nodes.map(n => n.id === uploadNode.id ? updateRes.data : n));
        setIsUploadModalOpen(false);
      } else {
        alert('Lỗi cập nhật node với media: ' + updateRes.error);
      }
    } else {
      alert('Lỗi upload media: ' + res.error);
    }
    setIsUploading(false);
  };

  const renderNestedList = (parentId: string | null = null, depth: number = 0) => {
    const children = nodes.filter(n => n.parent_id === parentId);
    if (children.length === 0) return null;

    return (
      <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-4 pl-4 border-l border-zinc-200 dark:border-zinc-800' : ''}`}>
        {children.map(node => (
          <Accordion key={node.id} className="bg-white dark:bg-zinc-950 border rounded-md px-4">
            <AccordionItem value={node.id} className="border-none">
              <div className="flex justify-between items-center">
                <AccordionTrigger className="hover:no-underline py-3">
                  <span className="font-semibold">{node.title}</span>
                  <span className="ml-4 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">
                    {node.progress}%
                  </span>
                </AccordionTrigger>
                <div className="flex gap-2 items-center flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => handleAddChild(node.id)}>Thêm Node</Button>
                  <Button variant="outline" size="sm" onClick={() => handleEditNode(node)}>Sửa</Button>
                  <Button variant="outline" size="sm" onClick={() => handleOpenUpload(node)}>Upload</Button>
                  {node.media_files && node.media_files.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedMediaNode(node)}>
                      Media
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteNode(node.id)}>
                    Xóa
                  </Button>
                </div>
              </div>
              <AccordionContent>
                {node.description && <p className="text-sm text-zinc-500 mb-4">{node.description}</p>}
                {renderNestedList(node.id, depth + 1)}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Đang tải...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col bg-zinc-50 dark:bg-zinc-900">
      {windowWidth < 768 ? (
        <div className="p-4 overflow-auto h-full w-full">
          <Button onClick={() => handleAddChild(null)} className="mb-4">Tạo Root Node</Button>
          {nodes.length > 0 ? renderNestedList(null) : <p className="text-center text-zinc-500 mt-10">Chưa có dữ liệu</p>}
        </div>
      ) : (
        <div className="flex-1 w-full h-full">
          <ReactFlowProvider>
            <FlowComponent 
              knowledgeNodes={nodes} 
              onDeleteNode={handleDeleteNode} 
              onViewMedia={setSelectedMediaNode} 
              onAddChild={handleAddChild}
              onEdit={handleEditNode}
              onUploadMedia={handleOpenUpload}
              onAddRoot={() => handleAddChild(null)}
            />
          </ReactFlowProvider>
        </div>
      )}

      {/* Node Form Modal */}
      <Modal isOpen={isNodeModalOpen} onClose={() => setIsNodeModalOpen(false)} title={nodeModalMode === 'create' ? 'Tạo Node' : 'Chỉnh Sửa Node'}>
        <form onSubmit={handleSubmitNode} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Tiêu đề</label>
            <Input required value={nodeFormData.title} onChange={e => setNodeFormData({...nodeFormData, title: e.target.value})} placeholder="Nhập tiêu đề" />
          </div>
          <div>
            <label className="text-sm font-medium">Mô tả</label>
            <textarea 
              className="flex min-h-[80px] w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300" 
              value={nodeFormData.description} onChange={e => setNodeFormData({...nodeFormData, description: e.target.value})} placeholder="Nhập mô tả" 
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tiến độ (%)</label>
            <Input type="number" min={0} max={100} value={nodeFormData.progress} onChange={e => setNodeFormData({...nodeFormData, progress: parseInt(e.target.value) || 0})} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setIsNodeModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmittingNode}>{isSubmittingNode ? 'Đang lưu...' : 'Lưu'}</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Media Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={`Upload Media - ${uploadNode?.title}`}>
        <form onSubmit={handleUploadMedia} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium">Chọn file</label>
            <Input type="file" name="file" required />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isUploading}>{isUploading ? 'Đang upload...' : 'Upload'}</Button>
          </div>
        </form>
      </Modal>

      {/* View Media Modal */}
      <Modal 
        isOpen={!!selectedMediaNode} 
        onClose={() => setSelectedMediaNode(null)} 
        title={`Media - ${selectedMediaNode?.title}`}
      >
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-auto">
          {selectedMediaNode?.media_files?.map((media, idx) => (
            <div key={idx} className="border rounded-md p-2 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-900">
              {media.type?.includes('video') ? (
                <video src={media.url} controls className="max-w-full rounded-md max-h-64" />
              ) : media.type?.includes('image') || (media.url && media.url.match(/\.(jpeg|jpg|gif|png)$/i)) ? (
                <img src={media.url} alt={media.name} className="max-w-full rounded-md max-h-64 object-contain" />
              ) : (
                <a href={media.url} target="_blank" rel="noreferrer" className="text-blue-500 underline py-4">
                  Tải xuống / Xem {media.name}
                </a>
              )}
              <p className="text-xs text-zinc-500 mt-2 text-center w-full truncate" title={media.name}>{media.name}</p>
            </div>
          ))}
          {(!selectedMediaNode?.media_files || selectedMediaNode.media_files.length === 0) && (
            <p className="text-center text-zinc-500 py-8">Không có file media nào.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
