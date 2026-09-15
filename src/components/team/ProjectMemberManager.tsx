'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProjectMemberManagerProps {
  projectId: string;
}

export const ProjectMemberManager = ({ projectId }: ProjectMemberManagerProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    import('@/app/actions/auth.actions').then((m) => {
      m.getSessionUser().then((user) => {
        setCurrentUser(user);
      });
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId);
      
      if (data && !error) {
        setMembers(data);
      }
    };

    fetchMembers();

    const channel = supabase
      .channel('project-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${projectId}` },
        () => {
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const isLeader = currentUser?.role === 'admin' || 
                   members.find(m => m.user_email === currentUser?.email)?.role === 'leader';

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Tìm profile từ email (không phân biệt hoa thường)
    const normalizedEmail = email.toLowerCase();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();
      
    if (profileError || !profile) {
      toast.error('Không tìm thấy người dùng với email này trong hệ thống.');
      setIsLoading(false);
      return;
    }
    
    // Thêm vào project_members
    const { data, error } = await supabase
      .from('project_members')
      .insert({ project_id: projectId, user_email: normalizedEmail, role: 'member' })
      .select()
      .single();
    
    if (data && !error) {
      toast.success(`Đã thêm ${normalizedEmail} vào dự án`);
      setEmail('');
    } else {
      // Nếu lỗi là duplicate thì báo lỗi hợp lý
      if (error?.code === '23505') {
        toast.error('Người dùng đã ở trong dự án.');
      } else {
        toast.error('Lỗi: ' + (error?.message || 'Không thể thêm thành viên.'));
      }
    }

    setIsLoading(false);
  };
  
  const handleRemove = async (userEmail: string) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_email', userEmail);
      
    if (error) {
      toast.error('Lỗi xóa thành viên: ' + error.message);
    } else {
      toast.success('Đã xóa thành viên khỏi dự án');
    }
  };

  return (
    <div className="space-y-6">
      {isLeader && (
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="mb-4 text-lg font-medium">Mời thành viên vào Dự án</h3>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Nhập email thành viên..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all w-full"
              />
            </div>
            <Button type="submit" disabled={isLoading || !email} className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all w-full sm:w-auto mt-2 sm:mt-0">
              {isLoading ? 'Đang mời...' : 'Mời'}
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Danh sách thành viên ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có thành viên nào.</p>
        ) : (
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {members.map((member) => (
              <div key={member.user_email} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50">
                <div className="overflow-hidden">
                  <p className="font-medium truncate" title={member.user_email}>{member.user_email}</p>
                  <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                </div>
                {isLeader && member.role !== 'admin' && member.user_email !== currentUser?.email && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemove(member.user_email)}
                    className="ml-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 active:scale-95 focus-visible:ring-2 transition-all"
                  >
                    Xóa
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
