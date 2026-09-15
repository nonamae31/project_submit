'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TeamMember } from '@/types/team.types';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MemberManagerProps {
  teamId: string;
  initialMembers?: any[];
}

export const MemberManager = ({ teamId, initialMembers = [] }: MemberManagerProps) => {
  const [members, setMembers] = useState<any[]>(initialMembers);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', teamId);
      
      if (data && !error) {
        setMembers(data);
      }
    };

    fetchMembers();

    const channel = supabase
      .channel('project-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_members', filter: `project_id=eq.${teamId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMembers((prev) => {
              if (prev.find((m) => m.user_email === payload.new.user_email)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'DELETE') {
            setMembers((prev) => prev.filter((m) => m.user_email !== payload.old.user_email));
          } else if (payload.eventType === 'UPDATE') {
            setMembers((prev) => prev.map((m) => m.user_email === payload.new.user_email ? payload.new : m));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('project_members')
      .insert({ project_id: teamId, user_email: email, role: 'member' })
      .select()
      .single();
    
    if (data && !error) {
      setMembers((prev) => {
        if (prev.find((m) => m.user_email === data.user_email)) return prev;
        return [...prev, data];
      });
      toast.success(`Đã gửi lời mời tới ${email}`);
      setEmail('');
    } else {
      toast.error('Lỗi khi mời thành viên: ' + (error?.message || 'Email không hợp lệ'));
    }

    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h3 className="mb-4 text-lg font-medium">Mời thành viên</h3>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="nhap-email@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoFocus
              className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all w-full"
            />
          </div>
          <Button type="submit" disabled={isLoading || !email} className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all w-full sm:w-auto mt-2 sm:mt-0">
            {isLoading ? 'Đang mời...' : 'Mời'}
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Danh sách thành viên ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có thành viên nào.</p>
        ) : (
          <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {members.map((member) => (
              <div key={member.user_email} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50">
                <div className="overflow-hidden">
                  <p className="font-medium truncate" title={member.user_email || member.email}>{member.user_email || member.email}</p>
                  <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                </div>
                {member.role !== 'admin' && (
                  <Button variant="ghost" size="sm" className="ml-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 active:scale-95 focus-visible:ring-2 transition-all">
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
