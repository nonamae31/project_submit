'use client';

import { useState } from 'react';
import type { Column } from '@/types/board.types';
import { ColumnSettingsForm } from './ColumnSettingsForm';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { RBAC } from '@/components/team/RBAC';

interface ColumnViewProps {
  column: Column;
}

export function ColumnView({ column }: ColumnViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex h-full min-h-[500px] w-[300px] flex-col rounded-md bg-slate-100 p-3 shadow-sm dark:bg-slate-800">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-slate-900 dark:text-slate-50">{column.title}</h3>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings2 className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>

      {isEditing && (
        <div className="mb-4 rounded-md border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <ColumnSettingsForm column={column} onSuccess={() => setIsEditing(false)} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          Empty Column
          
          <RBAC userRole="member" allowedRoles={['admin', 'owner']}>
            <Button variant="outline" size="sm" className="w-full hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all">
              Tạo Task
            </Button>
            <Button variant="destructive" size="sm" className="w-full hover:bg-red-600 active:scale-95 focus-visible:ring-2 transition-all">
              Xoá Task
            </Button>
          </RBAC>
        </div>
      </div>
    </div>
  );
}
