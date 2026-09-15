'use server';

import { supabase } from '@/lib/supabase/client';
import { revalidatePath } from 'next/cache';
import type { Team } from '@/types/team.types';

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function createTeam(formData: FormData): Promise<ActionResponse<Team>> {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name) {
    return { success: false, error: 'TÃªn team lÃ  báº¯t buá»™c' };
  }

  const { data, error } = await supabase
    .from('teams')
    .insert([{ name, description }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/(dashboard)', 'page');
  return { success: true, data: data as Team };
}
