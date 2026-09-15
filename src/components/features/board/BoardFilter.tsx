'use client';

import { useQueryState } from 'nuqs';
import { Input } from '@/components/ui/input'; // Assuming this exists or I'll create it
import { Search } from 'lucide-react';

export function BoardFilter() {
  const [search, setSearch] = useQueryState('search', { defaultValue: '' });

  return (
    <div className="relative flex w-full max-w-sm items-center">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        type="text"
        placeholder="Filter columns..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
