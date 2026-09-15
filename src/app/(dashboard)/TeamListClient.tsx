'use client';

import * as React from 'react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateTeamDialog } from '@/components/team/CreateTeamDialog';
import { MemberManager } from '@/components/team/MemberManager';
import type { Team } from '@/types/team.types';

interface TeamListClientProps {
  initialTeams: Team[];
}

export const TeamListClient = ({ initialTeams }: TeamListClientProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">Danh sách Teams</h2>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all">
          <Plus className="h-4 w-4" /> Tạo Team
        </Button>
      </div>
      
      {initialTeams.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">Chưa có team nào</h3>
          <p className="text-sm text-slate-500">Bắt đầu bằng cách tạo một team mới để quản lý thành viên.</p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-4 gap-2 hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all" variant="outline">
            <Plus className="h-4 w-4" /> Tạo Team
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialTeams.map((team) => (
            <div 
              key={team.id} 
              className={`flex cursor-pointer flex-col justify-between rounded-xl border p-5 shadow-sm transition-colors hover:shadow-md ${
                selectedTeamId === team.id 
                  ? 'border-slate-900 bg-slate-50 dark:border-slate-400 dark:bg-slate-900' 
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
              }`}
              onClick={() => setSelectedTeamId(team.id)}
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{team.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{team.description || 'Không có mô tả'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTeamId && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quản lý thành viên</h2>
            <Button variant="outline" size="sm" onClick={() => setSelectedTeamId(null)} className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all">
              Đóng
            </Button>
          </div>
          <MemberManager teamId={selectedTeamId} />
        </div>
      )}

      <CreateTeamDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
      />
    </div>
  );
};
