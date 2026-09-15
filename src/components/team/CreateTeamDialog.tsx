'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/Modal';
import { createTeam } from '@/app/actions/team.actions';

interface CreateTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTeamDialog = ({ isOpen, onClose }: CreateTeamDialogProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createTeam(formData);

    setIsLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Đã có lỗi xảy ra');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Team Mới">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/50">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Tên Team</Label>
          <Input 
            id="name" 
            name="name" 
            placeholder="Nhập tên team..." 
            required 
            disabled={isLoading}
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả (tùy chọn)</Label>
          <Input 
            id="description" 
            name="description" 
            placeholder="Nhập mô tả..." 
            disabled={isLoading}
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all">
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading} className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all">
            {isLoading ? 'Đang tạo...' : 'Tạo Team'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
