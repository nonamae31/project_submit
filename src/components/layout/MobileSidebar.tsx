'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarNav } from '@/components/layout/SidebarNav';
import type { Team } from '@/types/team.types';

interface MobileSidebarProps {
  teams?: Team[];
}

export function MobileSidebar({ teams }: MobileSidebarProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-slate-100 hover:text-slate-900 h-10 w-10 dark:hover:bg-slate-800 dark:hover:text-slate-50">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 pt-10 flex flex-col">
        <SheetTitle className="sr-only">Menu Điều hướng</SheetTitle>
        <SidebarNav teams={teams} />
      </SheetContent>
    </Sheet>
  );
}
