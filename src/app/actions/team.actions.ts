'use server';

import { supabase } from '@/lib/supabase/client';
import { revalidatePath } from 'next/cache';
import type { Team } from '@/types/team.types';
import { getSessionUser } from './auth.actions';

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createTeam(formData: FormData): Promise<ActionResponse<Team>> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name) {
    return { success: false, error: 'Tên team là bắt buộc' };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Bạn cần đăng nhập để tạo Team' };
  }

  const { data, error } = await supabase
    .from('teams')
    .insert([{ name, description, leader_id: user.id }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/(dashboard)', 'page');
  return { success: true, data: data as Team };
}

export async function getUserTeams(): Promise<Team[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const { data: ledTeams } = await supabase
    .from('teams')
    .select('*')
    .eq('leader_id', user.id);

  const { data: memberRows } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id);

  let memberTeams: Team[] = [];
  if (memberRows && memberRows.length > 0) {
    const teamIds = memberRows.map((r: any) => r.team_id);
    const { data: mTeams } = await supabase
      .from('teams')
      .select('*')
      .in('id', teamIds);
    if (mTeams) {
      memberTeams = mTeams as Team[];
    }
  }

  const allTeamsMap = new Map<string, Team>();
  (ledTeams as Team[] || []).forEach(t => allTeamsMap.set(t.id, t));
  memberTeams.forEach(t => allTeamsMap.set(t.id, t));

  return Array.from(allTeamsMap.values()).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

