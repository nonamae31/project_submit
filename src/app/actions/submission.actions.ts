'use server';

import { getSessionUser } from './auth.actions';
import { createClient } from '@/lib/supabase/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure cloudinary explicitly if CLOUDINARY_URL isn't automatically picked up in server actions
cloudinary.config({
  secure: true,
});

export async function getCloudinarySignature(taskId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');
  
  const timestamp = Math.round((new Date).getTime() / 1000);
  const folder = `submissions/${taskId}`;
  
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    cloudinary.config().api_secret!
  );
  
  return { 
    timestamp, 
    signature, 
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
    folder
  };
}

export async function saveSubmissionToDB(taskId: string, type: string, secureUrl: string, publicId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_submissions')
    .insert({
      task_id: taskId,
      user_id: user.id,
      type: type,
      content: secureUrl,
      cloudinary_public_id: publicId,
      is_public: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase Insert Error:', error);
    throw new Error(error.message);
  }
  return data;
}

export async function addTextOrLinkSubmission(taskId: string, type: string, content: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_submissions')
    .insert({
      task_id: taskId,
      user_id: user.id,
      type: type,
      content: content,
      is_public: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSubmission(submissionId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Get submission to check permissions and get public_id
  const { data: submission, error: fetchError } = await supabase
    .from('task_submissions')
    .select('*, tasks(project_id)')
    .eq('id', submissionId)
    .single();

  if (fetchError || !submission) throw new Error('Submission not found');

  // Check if owner or leader
  const isOwner = submission.user_id === user.id;
  const { data: memberData } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', (Array.isArray(submission.tasks) ? submission.tasks[0]?.project_id : (submission.tasks as any)?.project_id))
    .eq('user_email', user.email)
    .single();

  const isLeader = memberData?.role === 'leader' || memberData?.role === 'owner';

  if (!isOwner && !isLeader) {
    throw new Error('Not authorized to delete this submission');
  }

  // Delete from Cloudinary if media
  if (submission.cloudinary_public_id) {
    try {
      await cloudinary.uploader.destroy(submission.cloudinary_public_id);
      console.log('Đã xóa thành công trên Cloudinary: ' + submission.cloudinary_public_id);
    } catch (err) {
      console.error('Lỗi xóa Cloudinary', err);
      throw new Error('Failed to delete media from Cloudinary');
    }
  }

  // Delete from DB
  const { error: deleteError } = await supabase
    .from('task_submissions')
    .delete()
    .eq('id', submissionId);

  if (deleteError) throw new Error(deleteError.message);
  
  return true;
}

export async function toggleSubmissionPrivacy(submissionId: string, isPublic: boolean) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  
  // Verify leader
  const { data: submission } = await supabase
    .from('task_submissions')
    .select('tasks(project_id)')
    .eq('id', submissionId)
    .single();
    
  if (!submission) throw new Error('Not found');

  const projectId = Array.isArray(submission.tasks) ? submission.tasks[0]?.project_id : (submission.tasks as any)?.project_id;

  const { data: memberData } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_email', user.email)
    .single();

  const isLeader = memberData?.role === 'leader' || memberData?.role === 'owner' || memberData?.role === 'admin';
  
  if (!isLeader) {
    throw new Error('Only leader can change privacy');
  }

  const payload: any = { is_public: isPublic };
  if (isPublic) {
    payload.approved_by = user.id;
    payload.approved_at = new Date().toISOString();
  } else {
    payload.approved_by = null;
    payload.approved_at = null;
  }

  const { error } = await supabase
    .from('task_submissions')
    .update(payload)
    .eq('id', submissionId);

  if (error) throw new Error(error.message);
  return true;
}

export async function bulkApproveSubmissions(taskId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error('Unauthorized');

  const supabase = await createClient();
  
  // Get project_id to verify leader
  const { data: task } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', taskId)
    .single();
    
  if (!task) throw new Error('Task not found');

  const { data: memberData } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', task.project_id)
    .eq('user_email', user.email)
    .single();

  const isLeader = memberData?.role === 'leader' || memberData?.role === 'owner' || memberData?.role === 'admin';
  
  if (!isLeader) {
    throw new Error('Only leader can bulk approve');
  }

  const payload = {
    is_public: true,
    approved_by: user.id,
    approved_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('task_submissions')
    .update(payload)
    .eq('task_id', taskId);

  if (error) throw new Error(error.message);
  return true;
}
