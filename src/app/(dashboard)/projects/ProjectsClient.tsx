'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Project } from '@/types/project.types';

export function ProjectsClient({
  role,
  userId,
  ownedProjects,
  participatingProjects,
}: {
  role: string;
  userId: string;
  ownedProjects: Project[];
  participatingProjects: Project[];
}) {
  const [localOwned, setLocalOwned] = useState<Project[]>(ownedProjects);
  const [localParticipating, setLocalParticipating] = useState<Project[]>(participatingProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLocalOwned(ownedProjects);
  }, [ownedProjects]);

  useEffect(() => {
    setLocalParticipating(participatingProjects);
  }, [participatingProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          description: newProjectDesc,
          owner_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setLocalOwned([data as Project, ...localOwned]);
        setIsModalOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
        router.refresh();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const ProjectCard = ({ project }: { project: Project }) => (
    <Link href={`/projects/${project.id}/board`} key={project.id}>
      <div className="border rounded-xl p-4 hover:border-primary transition-colors cursor-pointer bg-white dark:bg-zinc-950 shadow-sm hover:shadow-md">
        <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
          {project.description || 'No description provided.'}
        </p>
        <div className="mt-4 text-xs text-zinc-400">
          Created: {new Date(project.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage your projects and boards.</p>
        {role === 'admin' && (
          <Button onClick={() => setIsModalOpen(true)}>Tạo Dự án mới</Button>
        )}
      </div>

      <div className="space-y-8">
        {role === 'admin' && (
          <section>
            <h2 className="text-xl font-bold mb-4">Dự án làm chủ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {localOwned.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
              {localOwned.length === 0 && (
                <div className="col-span-full text-center py-12 border border-dashed rounded-xl text-zinc-500">
                  No owned projects found. Create one to get started!
                </div>
              )}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold mb-4">Dự án đang tham gia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localParticipating.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
            {localParticipating.length === 0 && (
              <div className="col-span-full text-center py-12 border border-dashed rounded-xl text-zinc-500">
                You are not participating in any projects yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Dự án mới"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên dự án</Label>
            <Input
              id="name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Nhập tên dự án..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả (tùy chọn)</Label>
            <Input
              id="description"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Nhập mô tả dự án..."
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="mr-2">
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !newProjectName.trim()}>
              {isLoading ? 'Đang tạo...' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
