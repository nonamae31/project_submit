'use server';

import { supabase } from '@/lib/supabase/client';
import { getSessionUser } from '@/app/actions/auth.actions';

/**
 * Creates a signed URL for a file in the Supabase storage 'tasks' bucket
 * This satisfies the 'action render signed URL' requirement
 */
export async function getSignedUrlAction(filePath: string) {
  if (!filePath) {
    return { error: 'No file path provided' };
  }
  
  // Example for private bucket signed URL
  const { data, error } = await supabase.storage
    .from('tasks')
    .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
    
  if (error) {
    console.error('Error generating signed URL:', error);
    return { error: error.message };
  }
  
  return { signedUrl: data.signedUrl };
}

export async function deleteTask(taskId: string, projectId: string) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { createServerClient } = await import('@supabase/ssr');
  const serverSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: memberData, error: memberError } = await serverSupabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_email', user.email)
    .single();

  if (memberError || !memberData) {
    throw new Error('Not a member of this project');
  }

  if (memberData.role !== 'leader') {
    throw new Error('Only project leaders can delete tasks');
  }

  const { error: updateError } = await serverSupabase
    .from('tasks')
    .update({ is_deleted: true })
    .eq('id', taskId);

  if (updateError) {
    throw new Error('Failed to delete task: ' + updateError.message);
  }

  return { success: true };
}