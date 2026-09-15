'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { loginAndSetCookies } from '@/app/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Email is invalid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Xác thực bằng bảng public.profiles thay vì auth.users
      const normalizedEmail = data.email.toLowerCase();
      const { data: profile, error: signInError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('password', data.password)
        .single();

      if (signInError || !profile) {
        setError('Tài khoản hoặc mật khẩu không chính xác');
      } else {
        const isForceChange = data.password === '123456';
        await loginAndSetCookies(profile.id, isForceChange);
        
        if (isForceChange) {
          router.push('/force-change-password');
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/50 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="space-y-4 rounded-md shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="email-address">Email address</Label>
          <Input
            id="email-address"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Button 
          type="submit" 
          className="w-full hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all" 
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        <p className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-500 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </form>
  );
}
