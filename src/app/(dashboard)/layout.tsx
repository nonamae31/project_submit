import * as React from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

import { supabase } from '@/lib/supabase/client';
import type { Team } from '@/types/team.types';
import { UserDropdown } from '@/components/user-dropdown';
import { SidebarInviteButton } from '@/components/layout/SidebarInviteButton';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: teams, error: _error } = await supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 flex flex-col">
        <div className="flex h-14 items-center border-b border-slate-200 px-4 dark:border-slate-800 shrink-0">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hover:text-slate-700 transition-colors">
            Dashboard
          </Link>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Teams</h2>
          </div>
          <nav className="space-y-1 mb-6">
            {teams?.map((team: Team) => (
              <Link 
                key={team.id} 
                href={`/?team=${team.id}`}
                className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all dark:text-slate-200"
              >
                {team.name}
              </Link>
            ))}
            {(!teams || teams.length === 0) && (
              <p className="px-3 py-2 text-sm text-slate-500">Chưa có dự án nào</p>
            )}
          </nav>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
             <React.Suspense fallback={null}>
               <SidebarInviteButton />
             </React.Suspense>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-end border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <UserDropdown />
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
