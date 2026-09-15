import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";
import { createClient } from "@/lib/supabase/server";

import { getSessionUser } from '@/app/actions/auth.actions';

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Hồ sơ cá nhân</h1>
      <ProfileClient userId={user.id} />
    </div>
  );
}
