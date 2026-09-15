import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Thay vì lấy từ auth.users, lấy từ cookie 'user_session'
  const sessionUserId = request.cookies.get('user_session')?.value;
  const user = sessionUserId ? { id: sessionUserId } : null;

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');
  const isForceChangeRoute = request.nextUrl.pathname.startsWith('/force-change-password');
  const hasForceChangeCookie = request.cookies.get('force_pwd_change')?.value === 'true';

  // Protect protected routes
  if (
    !user &&
    !isAuthRoute &&
    !request.nextUrl.pathname.startsWith('/api')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    if (hasForceChangeCookie) {
      response.cookies.delete('force_pwd_change');
    }
    return response;
  }

  // If logged in
  if (user) {
    if (hasForceChangeCookie) {
      if (!isForceChangeRoute && !request.nextUrl.pathname.startsWith('/api/auth/callback')) {
        const url = request.nextUrl.clone();
        url.pathname = '/force-change-password';
        return NextResponse.redirect(url);
      }
    } else {
      if (isForceChangeRoute || isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
