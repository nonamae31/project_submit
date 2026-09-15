import { createClient } from '@/lib/supabase/server';
import { ProjectsClient } from './ProjectsClient';
import type { Project } from '@/types/project.types';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/app/actions/auth.actions';

export const revalidate = 0; // Disable cache for this page

export default async function ProjectsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Fetch role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
  }

  const role = profile?.role || 'user';

  let ownedProjects: Project[] = [];
  if (role === 'admin') {
    const { data: ownerData, error: ownerError } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (ownerError) console.error('Error fetching owned projects:', ownerError);
    ownedProjects = (ownerData as Project[]) || [];
  }

  // Fetch participating projects
  const { data: participatingData, error: participatingError } = await supabase
    .from('projects')
    .select('*, project_members!inner(user_email)')
    .eq('project_members.user_email', user.email)
    .order('created_at', { ascending: false });

  if (participatingError) console.error('Error fetching participating projects:', participatingError);
  
  const participatingProjects = (participatingData as any[])?.map(p => {
    const { project_members, ...project } = p;
    return project as Project;
  }) || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>
      <ProjectsClient 
        role={role} 
        userId={user.id}
        ownedProjects={ownedProjects} 
        participatingProjects={participatingProjects} 
      />
    </div>
  );
}
