'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Submission } from '@/types/kanban.types';
import {
  uploadSubmissionMedia,
  addTextOrLinkSubmission,
  deleteSubmission,
  toggleSubmissionPrivacy,
  bulkApproveSubmissions
} from '@/app/actions/submission.actions';
import Image from 'next/image';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useKanbanStore } from '@/stores/useKanbanStore';
import { Loader2 } from 'lucide-react';

interface TaskSubmissionsProps {
  taskId: string;
  projectId: string;
  isLeader: boolean;
  isOwnerOrLeader: boolean;
  currentUserId?: string;
}

export function TaskSubmissions({ taskId, projectId, isLeader, isOwnerOrLeader, currentUserId }: TaskSubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const task = useKanbanStore(state => state.tasks.find(t => t.id === taskId));
  
  // Fake progress bar
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [textInput, setTextInput] = useState('');
  const [linkInput, setLinkInput] = useState('');

  // E1: Lightbox state
  const [lightboxMedia, setLightboxMedia] = useState<Submission | null>(null);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('task_submissions')
      .select('*, approver:profiles!task_submissions_approved_by_fkey(email)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setSubmissions(data as any as Submission[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubmissions();
  }, [taskId]);

  const simulateProgress = () => {
    setUploadProgress(0);
    setIsUploading(true);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const interval = simulateProgress();
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);
      
      const type = file.type.startsWith('image/') ? 'image' : 
                   file.type.startsWith('video/') ? 'video' : 'doc';
      formData.append('type', type);

      await uploadSubmissionMedia(formData);
      
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        fetchSubmissions(); // Refresh to get relations
      }, 500);

      toast.success('Tải lên thành công');
    } catch (error: any) {
      clearInterval(interval);
      setIsUploading(false);
      setUploadProgress(0);
      toast.error('Lỗi tải lên: ' + error.message);
    }
  };

  const handleAddTextOrLink = async (type: 'text' | 'link', content: string) => {
    if (!content.trim()) return;
    try {
      await addTextOrLinkSubmission(taskId, type, content);
      fetchSubmissions();
      if (type === 'text') setTextInput('');
      if (type === 'link') setLinkInput('');
      toast.success('�?ã thêm thành công');
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const prevSubmissions = [...submissions];
    setSubmissions(submissions.filter(s => s.id !== id));
    
    try {
      await deleteSubmission(id);
      toast.success('�?ã xóa');
    } catch (error: any) {
      setSubmissions(prevSubmissions); // Revert
      toast.error('Lỗi xóa: ' + error.message);
    }
  };

  const handleTogglePrivacy = async (id: string, isPublic: boolean) => {
    // E3/E4: Update UI Optimistically including Badge
    const prevSubmissions = [...submissions];
    setSubmissions(submissions.map(s => s.id === id ? { ...s, is_public: isPublic } : s));

    try {
      await toggleSubmissionPrivacy(id, isPublic);
      fetchSubmissions(); // Re-fetch to get approver email
    } catch (error: any) {
      setSubmissions(prevSubmissions);
      toast.error('Lỗi: ' + error.message);
    }
  };

  
  const handleEvaluate = async (submission: Submission) => {
    if (!task?.ai_prompt) {
      toast.error('Task này chưa được cấu hình Tiêu chí AI.');
      return;
    }
    
    setEvaluatingId(submission.id);
    try {
      const res = await fetch('/api/evaluate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: submission.content,
          prompt: task.ai_prompt,
          submissionId: submission.id
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to evaluate');
      
      toast.success('Đã nhận phản hồi từ AI');
      fetchSubmissions(); // reload to get ai_feedback
    } catch (err: any) {
      toast.error('Lỗi AI: ' + err.message);
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleBulkApprove = async () => {
    try {
      await bulkApproveSubmissions(taskId);
      toast.success('�?ã duyệt tất cả');
      fetchSubmissions();
    } catch (error: any) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  // E2: Helper to get video thumbnail
  const getVideoThumbnail = (url: string) => {
    if (!url.includes('cloudinary.com')) return undefined;
    return url.replace(/\.(mp4|mov|webm)$/i, '.jpg');
  };

  if (loading) return <div className="text-sm text-zinc-500">�?ang tải...</div>;

  return (
    <div className="flex flex-col gap-6 mt-4 relative">
      
      {/* Upload Controls */}
      <div className="flex flex-col gap-4 p-4 border border-zinc-200 dark:border-zinc-800 rounded-md">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold">Nộp bài mới</h4>
          {isLeader && submissions.some(s => !s.is_public) && (
            <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleBulkApprove}>
              ✅ Duyệt tất cả (Bulk Approve)
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <input type="file" id="submission-file" className="hidden" onChange={handleFileUpload} />
          <label htmlFor="submission-file">
            <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('submission-file')?.click()} disabled={isUploading}>
              📎 �?ính kèm File/Ảnh
            </Button>
          </label>
        </div>

        {isUploading && (
          <div className="w-full bg-zinc-200 rounded-full h-2.5 dark:bg-zinc-700">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}

        <div className="flex gap-2">
          <Input 
            placeholder="Nhập Link URL..." 
            value={linkInput} 
            onChange={(e) => setLinkInput(e.target.value)} 
            className="text-sm"
          />
          <Button size="sm" onClick={() => handleAddTextOrLink('link', linkInput)}>Thêm Link</Button>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm">Ghi chú / Văn bản</span>
          <RichTextEditor 
            content={textInput} 
            onChange={(html) => setTextInput(html)} 
          />
          <Button size="sm" onClick={() => handleAddTextOrLink('text', textInput)} className="self-end mt-1">Thêm Text</Button>
        </div>
      </div>

      {/* Submissions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {submissions.length === 0 && (
          <p className="text-sm text-zinc-500 col-span-full">Chưa có bài nộp nào.</p>
        )}

        {submissions.map(sub => {
          const isFileVisible = isLeader || sub.is_public || sub.user_id === currentUserId;

          return (
            <div key={sub.id} className="relative flex flex-col gap-2 p-3 border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded">
                    {sub.type}
                  </span>
                  {/* E3: Pending Approval Badge */}
                  {sub.is_public ? (
                    <span className="text-[10px] font-bold uppercase text-green-600 bg-green-100 px-1.5 py-0.5 rounded">�?ã duyệt</span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded flex items-center gap-1">🔒 Ch�? duyệt</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {isLeader && (
                    <Switch 
                      checked={sub.is_public}
                      onCheckedChange={(val) => handleTogglePrivacy(sub.id, val)}
                      className="scale-75 origin-right"
                    />
                  )}
                  
                  {(isLeader || sub.user_id === currentUserId) && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-full" onClick={() => handleDelete(sub.id)}>×</Button>
                  )}
                </div>
              </div>

              <div className="flex-1 cursor-pointer" onClick={() => (sub.type === 'image' || sub.type === 'video') && isFileVisible && setLightboxMedia(sub)}>
                {!isFileVisible ? (
                  <p className="text-sm text-zinc-400 italic">🔒 �?ang khóa ch�? phê duyệt</p>
                ) : (
                  <>
                    {sub.type === 'image' && (
                      <div className="relative w-full h-32 rounded bg-zinc-100 dark:bg-zinc-900 overflow-hidden group">
                        <Image src={sub.content} alt="Image submission" fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">Phóng to</span>
                        </div>
                      </div>
                    )}
                    {sub.type === 'video' && (
                      <div className="relative w-full h-32 rounded bg-zinc-900 overflow-hidden group">
                        {/* E2: Cloudinary Poster generated via URL replacement */}
                        <video src={sub.content} poster={getVideoThumbnail(sub.content)} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {sub.type === 'doc' && (
                      <a href={sub.content} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline line-clamp-2" onClick={(e) => e.stopPropagation()}>
                        📄 View Document
                      </a>
                    )}
                    {sub.type === 'link' && (
                      <div className="flex flex-col gap-2">
                        <a href={sub.content} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline line-clamp-2" onClick={(e) => e.stopPropagation()}>
                          🔗 {sub.content}
                        </a>
                        
                        {isLeader && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-fit text-xs h-7"
                            disabled={evaluatingId === sub.id}
                            onClick={(e) => { e.stopPropagation(); handleEvaluate(sub); }}
                          >
                            {evaluatingId === sub.id ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> AI đang đọc tài liệu...</>
                            ) : '🤖 AI Đánh giá'}
                          </Button>
                        )}
                        
                        {sub.ai_feedback && (
                          <div className={`mt-2 p-3 rounded-md border text-sm ${sub.ai_feedback.status === 'PASS' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30' : sub.ai_feedback.status === 'FAIL' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/30' : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'}`}>
                            <div className="flex items-center gap-2 font-semibold mb-1">
                              🤖 AI Nhận xét:
                              <span className={`text-xs px-2 py-0.5 rounded ${sub.ai_feedback.status === 'PASS' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100' : sub.ai_feedback.status === 'FAIL' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'}`}>
                                {sub.ai_feedback.status}
                              </span>
                            </div>
                            <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{sub.ai_feedback.comment}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {sub.type === 'text' && (
                      <div className="prose dark:prose-invert prose-sm text-zinc-700 dark:text-zinc-300 max-w-none line-clamp-4" dangerouslySetInnerHTML={{ __html: sub.content }} />
                    )}
                  </>
                )}
              </div>

              {/* E4: Audit Log */}
              {sub.is_public && sub.approver && (
                <div className="text-[10px] text-zinc-400 mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-1">
                  Duyệt bởi: {sub.approver.email} {sub.approved_at && `(${new Date(sub.approved_at).toLocaleDateString()})`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* E1: Lightbox Gallery Modal */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxMedia(null)}>
          <button className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-xl" onClick={() => setLightboxMedia(null)}>×</button>
          
          <div className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia.type === 'image' && (
              <img src={lightboxMedia.content} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-md" />
            )}
            {lightboxMedia.type === 'video' && (
              <video src={lightboxMedia.content} controls autoPlay className="max-w-full max-h-[90vh] rounded-md" />
            )}
          </div>
        </div>
      )}

    </div>
  );
}
