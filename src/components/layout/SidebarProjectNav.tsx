'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Users } from 'lucide-react';

export function SidebarProjectNav() {
  const params = useParams();
  const id = params?.id;
  const [invite, setInvite] = useQueryState('invite');

  if (!id) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
          Project Actions
        </h2>
      </div>
      <nav className="space-y-1">
        <button
          onClick={() => setInvite('true')}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-95 focus-visible:ring-2 focus-visible:outline-none transition-all dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Users className="h-4 w-4" />
          Mời thành viên
        </button>
      </nav>
    </div>
  );
}
