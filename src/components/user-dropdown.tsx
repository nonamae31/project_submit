"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase/client";

import { clearSessionCookie } from '@/app/actions/auth.actions';

export function UserDropdown({ user }: { user?: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    await clearSessionCookie();
    router.push("/login");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    if (name.includes("@")) return name.substring(0, 2).toUpperCase();
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user?.avatar_url || ""} alt={user?.full_name || "User"} />
          <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
            {getInitials(user?.full_name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {user?.full_name && (
          <>
            <div className="px-2 py-1.5 text-sm font-medium border-b border-slate-100 dark:border-slate-800 mb-1 truncate" title={user.email}>
              {user.full_name}
            </div>
          </>
        )}
        <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
          Hồ sơ cá nhân
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/50 dark:focus:text-red-400">
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
