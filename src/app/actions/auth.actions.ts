'use server';

import { cookies } from 'next/headers';

export async function setForceChangePasswordCookie() {
  const cookieStore = await cookies();
  cookieStore.set('force_pwd_change', 'true', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

export async function clearForceChangePasswordCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('force_pwd_change');
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('user_session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

export async function loginAndSetCookies(userId: string, forceChange: boolean) {
  const cookieStore = await cookies();
  cookieStore.set('user_session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  if (forceChange) {
    cookieStore.set('force_pwd_change', 'true', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  } else {
    cookieStore.delete('force_pwd_change');
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('user_session');
}
export async function updateProfilePassword(newPassword: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_session')?.value;
  if (!userId) throw new Error('Not logged in');
  
  const { createServerClient } = await import('@supabase/ssr');
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  
  const { error } = await supabase
    .from('profiles')
    .update({ password: newPassword })
    .eq('id', userId);
    
  if (error) throw new Error(error.message);
}
export async function getSessionUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_session')?.value;
  if (!userId) return null;
  
  const { createServerClient } = await import('@supabase/ssr');
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  return data;
}
