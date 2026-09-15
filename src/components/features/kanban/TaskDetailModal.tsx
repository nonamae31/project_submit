'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import type { Task } from '@/types/kanban.types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { supabase } from '@/lib/supabase/client';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskSubmissions } from './TaskSubmissions';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal = ({ task, isOpen, onClose }: TaskDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'submissions'>('details');
  const [members, setMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Editable state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  const { updateTaskAssignee, columns, setTasks } = useKanbanStore();

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAiPrompt(task.ai_prompt || '');
      setActiveTab('details'); // Reset tab when opening a new task
    }
  }, [task, isOpen]);

  useEffect(() => {
    import('@/app/actions/auth.actions').then((m) => {
      m.getSessionUser().then((user) => {
        setCurrentUser(user);
      });
    });
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!task) return;

      let projectId = task.project_id;
      if (!projectId) {
        const col = columns.find(c => c.id === task.column_id);
        if (col) projectId = col.project_id;
      }

      if (projectId) {
        const { data } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', projectId);
        if (data) setMembers(data);
      }
    };

    if (isOpen) {
      fetchMembers();
    }
  }, [task, isOpen, columns]);

  const handleUpdate = async (field: string, value: any) => {
    if (!task) return;
    
    // Update locally in store first (optimistic)
    setTasks(useKanbanStore.getState().tasks.map(t => 
      t.id === task.id ? { ...t, [field]: value } : t
    ));

    const { error } = await supabase
      .from('tasks')
      .update({ [field]: value })
      .eq('id', task.id);
      
    if (error) {
      toast.error('Lỗi cập nhật');
    } else {
      toast.success('Đã lưu');
    }
  };

  if (!task) return null;

  const currentColumn = columns.find(c => c.id === task.column_id);
  
  // RBAC Privacy Logic
  const currentUserEmail = currentUser?.email;
  const userMemberRecord = members.find(m => m.user_email === currentUserEmail);
  const isLeader = userMemberRecord?.role === 'admin' || userMemberRecord?.role === 'owner' || userMemberRecord?.role === 'leader';
  const isAssignee = task.assignee === currentUserEmail;
  const isOwnerOrLeader = isLeader || isAssignee;

  // Let's resolve the project_id to pass it down
  let projectId = task.project_id;
  if (!projectId) {
    const col = columns.find(c => c.id === task.column_id);
    if (col) projectId = col.project_id;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <Input 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => handleUpdate('title', title)}
          className="text-lg font-semibold border-transparent px-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary w-full max-w-sm"
          placeholder="Tên công việc"
        />
      }
    >
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-4">
        <button 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          onClick={() => setActiveTab('details')}
        >
          Chi tiết
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'submissions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          onClick={() => setActiveTab('submissions')}
        >
          Bài nộp (Đa phương tiện)
        </button>
      </div>

      {activeTab === 'details' ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-zinc-500">Trạng thái:</h4>
            <span className="inline-block rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold dark:bg-zinc-800">
              {currentColumn?.title || 'Unknown'}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium text-zinc-500">Người thực hiện (Assignee)</h4>
            <Select
              value={task.assignee || ''}
              onValueChange={(value: string | null) => {
                if (value) {
                  updateTaskAssignee(task.id, value);
                  handleUpdate('assignee', value);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Chưa giao cho ai" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.user_email} value={member.user_email}>
                    {member.user_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium text-zinc-500">Mô tả chi tiết</h4>
            <RichTextEditor 
              content={description}
              onChange={(html) => setDescription(html)}
            />
            <Button size="sm" variant="outline" className="w-fit mt-1" onClick={() => handleUpdate('description', description)}>
              Lưu mô tả
            </Button>
          </div>
        </div>
      ) : (
        <TaskSubmissions 
          taskId={task.id} 
          projectId={projectId || ''} 
          isLeader={isLeader} 
          isOwnerOrLeader={isOwnerOrLeader} 
          currentUserId={currentUser?.id}
        />
      )}
    </Modal>
  );
};
