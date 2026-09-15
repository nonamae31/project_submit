import { supabase } from '@/lib/supabase/client';
import { TeamListClient } from './TeamListClient';
import type { Team } from '@/types/team.types';

export const revalidate = 0; // Disable static rendering to fetch fresh data

export default async function DashboardPage() {
  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching teams:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Quản lý Team</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Xem, tạo và quản lý các team cũng như thành viên của bạn.</p>
      </div>
      <TeamListClient initialTeams={(teams as Team[]) || []} />
    </div>
  );
}
