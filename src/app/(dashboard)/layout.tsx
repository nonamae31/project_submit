import * as React from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

import { supabase } from '@/lib/supabase/client';
import type { Team } from '@/types/team.types';
import { UserDropdown } from '@/components/user-dropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { MobileSidebar } from '@/components/layout/MobileSidebar';

import { getUserTeams } from '@/app/actions/team.actions';
import { getSessionUser } from '@/app/actions/auth.actions';

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const teamsList = await getUserTeams();
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* E3: Hide sidebar on mobile, show on md+ */}
      <aside className="hidden md:flex w-64 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 flex-col">
        <div className="flex h-14 items-center border-b border-slate-200 px-6 dark:border-slate-800 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white hover:text-slate-700 transition-colors">
              SuperBoy
            </span>
          </Link>
        </div>
        
        {/* E1: Extracted Client Component for active state and performance */}
        <SidebarNav teams={teamsList} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 md:justify-end dark:border-slate-800 dark:bg-slate-950">
          
          {/* E3: Mobile Sidebar Hamburger Menu */}
          <div className="md:hidden flex items-center">
            <MobileSidebar teams={teamsList} />
            <Link href="/" className="ml-3 font-bold text-slate-900 dark:text-white">
              SuperBoy
            </Link>
          </div>

          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <UserDropdown user={user} />
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto max-w-5xl h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
