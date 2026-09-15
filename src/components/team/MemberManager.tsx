'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MemberManagerProps {
  teamId: string;
}

export const MemberManager = ({ teamId }: MemberManagerProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*, profiles!inner(email, full_name)')
        .eq('team_id', teamId);
      
      if (data && !error) {
        setMembers(data);
      }
    };

    fetchMembers();

    const channel = supabase
      .channel('team-members')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` },
        () => {
          fetchMembers(); // Re-fetch all to get the joined profiles data
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
    
    // 1. Tìm user_id từ email (không phân biệt hoa thường)
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
    
    // 2. Thêm vào team_members
    const { data, error } = await supabase
      .from('team_members')
      .insert({ team_id: teamId, user_id: profile.id, role: 'member' })
      .select()
      .single();
    
    if (data && !error) {
      toast.success(`Đã thêm ${normalizedEmail} vào đội`);
      setEmail('');
    } else {
      // Catch unique constraint violation
      toast.error('Lỗi: ' + (error?.message || 'NgÆ°á» i dùng đã ở trong team.'));
    }

    setIsLoading(false);
  };
  
  const handleRemove = async (userId: string) => {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
      
    if (error) {
      toast.error('Lỗi xóa thành viên: ' + error.message);
    } else {
      toast.success('Đã xóa thành viên');
    }
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
              placeholder="Nhập email thành viên..." 
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
              <div key={member.user_id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors dark:hover:bg-slate-900/50">
                <div className="overflow-hidden">
                  <p className="font-medium truncate" title={member.profiles?.email}>{member.profiles?.email || 'Unknown'}</p>
                  <p className="text-sm text-slate-500 capitalize">{member.role}</p>
                </div>
                {member.role !== 'admin' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemove(member.user_id)}
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
