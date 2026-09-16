'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { toast } from 'sonner';
import { Lightbulb, FileText, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // E6: Role Badge

const PROMPT_TEMPLATES = [
  { label: 'Tóm tắt nội dung', text: 'Hãy tóm tắt nội dung chính của tài liệu này.', icon: <FileText className="w-3 h-3 mr-1" /> },
  { label: 'Kiểm tra lỗi chính tả', text: 'Hãy kiểm tra lỗi chính tả và ngữ pháp trong tài liệu.', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
];

interface ProjectMember {
  user_email: string;
  role: string;
}

interface CreateTaskModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  defaultColumnId?: string;
  defaultAssignee?: string;
}

export const CreateTaskModal = ({ projectId, isOpen, onClose, defaultColumnId, defaultAssignee }: CreateTaskModalProps) => {
  const { columns, addTask } = useKanbanStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState<string>(defaultColumnId || '');
  const [assignee, setAssignee] = useState<string>(defaultAssignee || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  
  // E2: Dropdown Search State
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAssignee(defaultAssignee || '');
      setAiPrompt('');
      if (defaultColumnId) setColumnId(defaultColumnId);
      else if (columns.length > 0) setColumnId(columns[0].id);
      setSearchQuery('');
    }
  }, [isOpen, defaultColumnId, defaultAssignee, columns]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!projectId) return;

      // FE-001: Fetch all members including leader/admin
      const { data } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);
        
      let allMembers = data || [];
      
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
    };

    if (isOpen) {
      fetchMembers();
    }
  }, [projectId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !columnId) return;

    setIsLoading(true);

    const newTask: Record<string, string | null> = {
      title,
      description,
      column_id: columnId,
      project_id: projectId,
      ai_prompt: aiPrompt.trim() ? aiPrompt.trim() : null
    };
    
    if (assignee && assignee !== 'unassigned') {
      newTask.assignee = assignee;
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      toast.error('Lỗi khi tạo công việc');
      setIsLoading(false);
      return;
    }

    if (data) {
      const stateTasks = useKanbanStore.getState().tasks;
      if (!stateTasks.find((t) => t.id === data.id)) {
        addTask(data);
      }
      toast.success('Đã tạo công việc');
    }
    
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  // E2: Filter members based on search
  const filteredMembers = members.filter(m => m.user_email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm công việc mới">
      {columns.length === 0 ? (
        <div className="py-4 text-center text-sm text-zinc-500">
          Vui lòng tạo ít nhất 1 cột trước khi tạo task.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Tên công việc</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên công việc"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="column">Cột trạng thái</Label>
            <Select value={columnId} onValueChange={(val) => setColumnId(val || '')} required>
              <SelectTrigger>
                <SelectValue placeholder="Chọn cột">
                  {columns.find(col => col.id === columnId)?.title || "Chọn cột"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Mô tả chi tiết</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả chi tiết..."
              className="resize-y"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="aiPrompt" className="flex items-center text-blue-600 dark:text-blue-400">
                <Lightbulb className="w-4 h-4 mr-1" />
                Tiêu chí đánh giá AI (Tùy chọn)
              </Label>
            </div>
            <div className="flex gap-2 flex-wrap mb-1">
              {PROMPT_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAiPrompt(tpl.text)}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded text-xs transition-colors border border-blue-200 dark:border-blue-800"
                >
                  {tpl.icon}
                  {tpl.label}
                </button>
              ))}
            </div>
            <Textarea
              id="aiPrompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ví dụ: Hãy kiểm tra xem tài liệu này đã liệt kê đủ 3 gạch đầu dòng về marketing chưa?"
              className="resize-y border-blue-200 dark:border-blue-800 focus-visible:ring-blue-500"
              rows={2}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="assignee">Người thực hiện</Label>
            <Select value={assignee} onValueChange={(val) => setAssignee(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Chưa giao cho ai">
                  {assignee === 'unassigned' ? 'Không giao cho ai' : assignee || 'Chưa giao cho ai'}
                </SelectValue>
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
                <SelectItem value="unassigned" className="text-zinc-500 italic mt-1">
                  Không giao cho ai
                </SelectItem>
                {filteredMembers.map((member) => (
                  <SelectItem key={member.user_email} value={member.user_email}>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px]">{member.user_email}</span>
                      {/* E6: Role Badge */}
                      {(member.role === 'admin' || member.role === 'leader') && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400">
                          Leader
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {filteredMembers.length === 0 && (
                  <div className="p-2 text-sm text-zinc-500 text-center">Không tìm thấy ai</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim() || !columnId}>
              {isLoading ? 'Đang tạo...' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
