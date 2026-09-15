'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { UserPlus } from 'lucide-react';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';

export const SidebarInviteButton = () => {
  const params = useParams();
  const projectId = params?.id as string | undefined;
  
  const [isInviteOpen, setIsInviteOpen] = useQueryState('invite', parseAsBoolean.withDefault(false));

  if (!projectId) return null;

  return (
    <>
      <button
        onClick={() => setIsInviteOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-accent hover:text-blue-600 active:scale-95 focus-visible:ring-2 transition-all dark:text-slate-200"
      >
        <UserPlus className="h-4 w-4" />
        Mời thành viên
      </button>
      
      {/* Modal is injected here so it stays in the React tree, but rendered via Portal by Shadcn Dialog */}
      <InviteMemberModal 
        teamId={projectId} 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(null)} 
      />
    </>
  );
};
