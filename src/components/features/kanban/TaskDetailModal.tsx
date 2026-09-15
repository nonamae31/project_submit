'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge'; // E6: Role Badge

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProjectMember {
  user_email: string;
  role: string;
}

interface User {
  id: string;
  email: string;
}

export const TaskDetailModal = ({ task: initialTask, isOpen, onClose }: TaskDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'details' | 'submissions'>('details');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // E2: Dropdown Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editable state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');

  const { tasks, updateTaskAssignee, columns, setTasks } = useKanbanStore();
  
  // Always use the latest task from the store to prevent stale props (desynchronization)
  const task = initialTask ? tasks.find(t => t.id === initialTask.id) || initialTask : null;

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setAiPrompt(task.ai_prompt || '');
      setActiveTab('details'); // Reset tab when opening a new task
    }
  }, [initialTask, isOpen]); // Use initialTask here so it only resets when opening a DIFFERENT task

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
        // FE-001: Fetch all members, including admins and leaders
        const { data } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', projectId);
          
        let allMembers = data || [];
        
        // Also ensure owner is in the list just in case
        const { data: projectData } = await supabase
          .from('projects')
          .select('owner_id')
          .eq('id', projectId)
          .single();

        if (projectData?.owner_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, role')
            .eq('id', projectData.owner_id)
            .single();
            
          if (profileData?.email) {
            if (!allMembers.some(m => m.user_email === profileData.email)) {
              allMembers = [{ user_email: profileData.email, role: 'leader' }, ...allMembers];
            }
          }
        }
        
        // Sort leaders to the top
        allMembers.sort((a, b) => {
          if (a.role === 'admin' || a.role === 'leader') return -1;
          if (b.role === 'admin' || b.role === 'leader') return 1;
          return 0;
        });
        
        setMembers(allMembers);
      }
    };

    if (isOpen) {
      fetchMembers();
    }
  }, [initialTask?.id, isOpen, columns]);

  const handleUpdate = async (field: keyof Task, value: string | null) => {
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
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Chưa giao cho ai" />
              </SelectTrigger>
              <SelectContent>
                {/* E2: Dropdown Search */}
                <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Input 
                    placeholder="Tìm theo email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.stopPropagation()} // Prevent closing dropdown on type
                  />
                </div>
                {members.filter(m => m.user_email.toLowerCase().includes(searchQuery.toLowerCase())).map((member) => (
                  <SelectItem key={member.user_email} value={member.user_email}>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px]">{member.user_email}</span>
                      {/* E6: Role Badge */}
                      {(member.role === 'admin' || member.role === 'leader' || member.role === 'owner') && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
                          Leader
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {members.filter(m => m.user_email.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="p-2 text-sm text-zinc-500 text-center">Không tìm thấy ai</div>
                )}
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
