'use client';

import * as React from 'react';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { supabase } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lightbulb, CheckCircle, List, FileText } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const PROMPT_TEMPLATES = [
  {
    icon: <CheckCircle className="w-3 h-3 mr-1" />,
    label: 'Chính tả & Ngữ pháp',
    text: 'Hãy kiểm tra xem tài liệu này có lỗi chính tả hoặc lỗi ngữ pháp tiếng Việt nào không. Trả lời ngắn gọn.'
  },
  {
    icon: <List className="w-3 h-3 mr-1" />,
    label: 'Cấu trúc 3 phần',
    text: 'Tài liệu này có chia thành cấu trúc rõ ràng gồm 3 phần: Mở bài, Thân bài, Kết luận không?'
  },
  {
    icon: <FileText className="w-3 h-3 mr-1" />,
    label: 'Tóm tắt & Chấm điểm',
    text: 'Hãy tóm tắt tài liệu này trong 3 câu và chấm điểm chất lượng nội dung từ 1-10.'
  }
];

export const CreateTaskModal = ({ isOpen, onClose, projectId }: CreateTaskModalProps) => {
  const { addTask, columns } = useKanbanStore();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [assignee, setAssignee] = React.useState('');
  const [columnId, setColumnId] = React.useState('');
  const [aiPrompt, setAiPrompt] = React.useState('');
  
  const [members, setMembers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (columns.length > 0 && !columnId) {
      setColumnId(columns[0].id);
    }
  }, [columns, columnId]);

  React.useEffect(() => {
    const fetchMembers = async () => {
      if (!projectId) return;
      const { data } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);
      
      if (data) {
        setMembers(data);
      }
    };
    if (isOpen) fetchMembers();
  }, [projectId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !columnId) return;

    setIsLoading(true);

    const newTask: any = {
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
      toast.error('Failed to create task');
      setIsLoading(false);
      return;
    }

    if (data) {
      const stateTasks = useKanbanStore.getState().tasks;
      if (!stateTasks.find((t) => t.id === data.id)) {
        addTask(data);
      }
      toast.success('Task created');
    }
    
    setTitle('');
    setDescription('');
    setAssignee('');
    setAiPrompt('');
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

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
                <SelectItem value="unassigned" className="text-zinc-500 italic">
                  Không giao cho ai
                </SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.user_email} value={member.user_email}>
                    {member.user_email}
                  </SelectItem>
                ))}
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
