'use client';

import React, { useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Users, User, UserMinus, LayoutGrid } from 'lucide-react';

export interface Task {
  id: string | number;
  assignee?: string | null;
  assignee_email?: string | null;
  assignee_avatar_url?: string | null;
  assignee_name?: string | null;
  [key: string]: any;
}

export interface FilterToolbarProps {
  tasks: Task[];
  currentUserEmail: string;
}

export default function FilterToolbar({ tasks, currentUserEmail }: FilterToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentAssignee = searchParams.get('assignee');

  const setAssignee = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('assignee', value);
    } else {
      params.delete('assignee');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const uniqueAssignees = useMemo(() => {
    const map = new Map<string, { email: string; avatar?: string | null; name?: string | null }>();
    tasks?.forEach((task) => {
      const email = task.assignee_email || task.assignee;
      if (email) {
        if (!map.has(email)) {
          map.set(email, {
            email: email,
            avatar: task.assignee_avatar_url,
            name: task.assignee_name || email,
          });
        }
      }
    });
    return Array.from(map.values());
  }, [tasks]);

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4 mb-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setAssignee(null)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            !currentAssignee 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          type="button"
        >
          <LayoutGrid className="w-4 h-4" />
          Tất cả
        </button>

        <button
          onClick={() => setAssignee(currentUserEmail)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentAssignee === currentUserEmail 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          type="button"
        >
          <User className="w-4 h-4" />
          Việc của tôi
        </button>

        <button
          onClick={() => setAssignee('unassigned')}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            currentAssignee === 'unassigned' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
          type="button"
        >
          <UserMinus className="w-4 h-4" />
          Chưa phân công
        </button>
      </div>

      {uniqueAssignees.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1 font-medium">
            <Users className="w-4 h-4" /> Thành viên:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {uniqueAssignees.map((assignee) => {
              const isActive = currentAssignee === assignee.email;
              return (
                <button
                  key={assignee.email}
                  onClick={() => setAssignee(isActive ? null : assignee.email)}
                  title={assignee.name || assignee.email}
                  className={`relative w-8 h-8 rounded-full overflow-hidden transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isActive 
                      ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-gray-900 scale-110' 
                      : 'ring-1 ring-gray-300 dark:ring-gray-700 opacity-70 hover:opacity-100'
                  }`}
                  type="button"
                >
                  {assignee.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={assignee.avatar} 
                      alt={assignee.name || assignee.email}
                      className="w-full h-full object-cover bg-white"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      {assignee.email.substring(0, 2)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
