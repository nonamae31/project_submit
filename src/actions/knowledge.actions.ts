'use server';

import { createClient } from '@/lib/supabase/server';
import cloudinary from '@/lib/cloudinary';
import { getSessionUser } from '@/app/actions/auth.actions';

interface KnowledgeNodeData {
  project_id: string;
  parent_id?: string | null;
  title: string;
  description?: string;
  progress?: number;
  media_files?: any[];
}

export async function createKnowledgeNode(data: KnowledgeNodeData) {
  try {
    const supabase = await createClient();
    
    // Check auth
    const user = await getSessionUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Insert node
    const { data: node, error } = await supabase
      .from('knowledge_nodes')
      .insert([
        {
          project_id: data.project_id,
          parent_id: data.parent_id || null,
          title: data.title,
          description: data.description || null,
          progress: data.progress || 0,
          media_files: data.media_files || [],
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data: node };
  } catch (error: any) {
    console.error('Error creating knowledge node:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadMediaNodeAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const user = await getSessionUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file uploaded');
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'knowledge_nodes',
          resource_type: 'auto' 
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return { 
      success: true, 
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        name: file.name,
        type: file.type,
        size: file.size
      }
    };
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return { success: false, error: error.message };
  }
}

export async function recursiveDeleteNodeAction(nodeId: string) {
  try {
    const supabase = await createClient();
    const user = await getSessionUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // 1. Get all descendants via RPC
    const { data: descendants, error: rpcError } = await supabase
      .rpc('get_all_descendants', { root_id: nodeId });

    if (rpcError) {
      throw rpcError;
    }

    // 2. Iterate through descendants and delete media from Cloudinary
    if (descendants && Array.isArray(descendants)) {
      for (const node of descendants) {
        if (node.media_files && Array.isArray(node.media_files)) {
          for (const media of node.media_files) {
            if (media.public_id) {
              try {
                // If the resource was uploaded as raw/video, you might need to pass resource_type to destroy
                // but since we don't store it rigidly in this example, we default to whatever cloudinary handles 
                // or just try image/auto. We will try image/video based on the type if available, but default is usually fine for image.
                // You can also add { resource_type: 'image' } etc. if needed.
                const resourceType = media.type && media.type.includes('video') ? 'video' : 
                                     media.type && media.type.includes('raw') ? 'raw' : 'image';
                
                await cloudinary.uploader.destroy(media.public_id, { resource_type: resourceType });
                console.log(`[CLOUDINARY] Đã xóa thành công file: ${media.public_id}`);
              } catch (cloudinaryError) {
                console.error(`[CLOUDINARY] Lỗi xóa file ${media.public_id}:`, cloudinaryError);
              }
            }
          }
        }
      }
    }

    // 3. Delete the root node from database (cascade will handle DB descendants)
    const { error: deleteError } = await supabase
      .from('knowledge_nodes')
      .delete()
      .eq('id', nodeId);

    if (deleteError) {
      throw deleteError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error recursively deleting node:', error);
    return { success: false, error: error.message };
  }
}

export async function updateKnowledgeNodeAction(nodeId: string, data: any) {
  try {
    const supabase = await createClient();
    const user = await getSessionUser();
    if (!user) throw new Error('Unauthorized');

    const { data: node, error } = await supabase
      .from('knowledge_nodes')
      .update({ title: data.title, description: data.description, progress: data.progress, media_files: data.media_files })
      .eq('id', nodeId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: node };
  } catch (error: any) {
    console.error('Error updating knowledge node:', error);
    return { success: false, error: error.message };
  }
}
