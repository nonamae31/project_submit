'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FolderGit2, Users, Settings } from 'lucide-react';
import type { Team } from '@/types/team.types';
import { SidebarInviteButton } from '@/components/layout/SidebarInviteButton';

interface SidebarNavProps {
  teams?: Team[];
}

const NAV_LINKS = [
  { name: 'Dashboard', href: '/', icon: Home, exact: true },
  { name: 'Dự án (Projects)', href: '/projects', icon: FolderGit2, exact: false },
  // Trỏ 'Đội nhóm' về '/' do hiện tại '/' đang là trang Quản lý Team
  { name: 'Đội nhóm (Teams)', href: '/?tab=teams', icon: Users, exact: false },
  { name: 'Cài đặt (Profile)', href: '/profile', icon: Settings, exact: false },
];

export function SidebarNav({ teams }: SidebarNavProps) {
  const pathname = usePathname();

  const isCurrentActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    // Handle query param hacks for teams
    if (href.startsWith('/?tab=')) {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
        <h2 className="mb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
          Chức năng
        </h2>
        {NAV_LINKS.map((item) => {
          const isActive = isCurrentActive(item.href, item.exact);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all relative
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
                }`}
            >
              {/* E2: Active Left Border Indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-2/3 w-1 bg-blue-600 rounded-r-md" aria-hidden="true" />
              )}
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                  }`}
                aria-hidden="true"
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}

        {/* Nút mời thành viên giờ sẽ nằm lọt thỏm chung vào danh sách các chức năng chính để dễ ấn hơn */}
        <React.Suspense fallback={null}><SidebarInviteButton /></React.Suspense>

        <div className="mt-8 mb-2 px-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
            Teams của bạn
          </h2>
        </div>
        <div className="space-y-1">
          {teams?.map((team) => {
            const isTeamActive = pathname === '/' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('team') === team.id;
            return (
              <Link 
                key={team.id} 
                href={`/?team=${team.id}`}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all
                  ${isTeamActive
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white'
                  }`}
              >
                <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold
                  ${isTeamActive
                    ? 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100'
                    : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 group-hover:border-slate-300'
                  }`}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">{team.name}</span>
              </Link>
            )
          })}
          {(!teams || teams.length === 0) && (
            <p className="px-3 py-2 text-sm text-slate-500 italic">Chưa có team nào</p>
          )}
        </div>
      </nav>
    </div>
  );
}
