'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { UserPlus } from 'lucide-react';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';

export const SidebarInviteButton = () => {
  const pathname = usePathname();
  
  // Extract project ID from pathname (e.g. /projects/123/board)
  const match = pathname.match(/^\/projects\/([^\/]+)/);
  const projectId = match ? match[1] : undefined;
  
  const [isInviteOpen, setIsInviteOpen] = useQueryState('invite', parseAsBoolean.withDefault(false));

  if (!projectId) return null;

  return (
    <>
      <button
        onClick={() => setIsInviteOpen(true)}
        className={`group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-all relative
          ${isInviteOpen 
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
      >
        {isInviteOpen && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-blue-600 rounded-r-md" aria-hidden="true" />
        )}
        <UserPlus 
          className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors
            ${isInviteOpen 
              ? 'text-blue-600 dark:text-blue-400' 
              : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
            }`}
          aria-hidden="true" 
        />
        <span className="truncate">Quản lý thành viên</span>
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
