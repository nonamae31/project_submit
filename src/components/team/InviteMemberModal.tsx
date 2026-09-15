'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// Lazy load ProjectMemberManager so it is not bundled with the Sidebar
const DynamicProjectMemberManager = dynamic(
  () => import('@/components/team/ProjectMemberManager').then((mod) => mod.ProjectMemberManager),
  { 
    ssr: false,
    loading: () => <div className="p-8 text-center text-sm text-zinc-500">Đang tải danh sách...</div> 
  }
);

interface InviteMemberModalProps {
  teamId: string; // Historically named teamId but it receives a projectId
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal = ({ teamId, isOpen, onClose }: InviteMemberModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quản lý thành viên Dự án</DialogTitle>
          <DialogDescription>
            Mời đồng đội tham gia dự án hoặc quản lý danh sách thành viên hiện tại.
          </DialogDescription>
        </DialogHeader>
        
        {/* Only render if it's open, further saving resources */}
        {isOpen && <DynamicProjectMemberManager projectId={teamId} />}
      </DialogContent>
    </Dialog>
  );
};
