'use server';

import { supabase } from '@/lib/supabase/client';

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
