'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

const registerSchema = z.object({
  email: z.string().email('Email is invalid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);

    try {
      // Vì đã chuyển sang dùng public.profiles thay vì auth.users
      const { data: newProfile, error: signUpError } = await supabase
        .from('profiles')
        .insert({
          email: data.email,
          password: data.password,
          full_name: data.email.split('@')[0],
          role: 'user'
        })
        .select()
        .single();

      if (signUpError) {
        setError(signUpError.message);
      } else {
        const { setSessionCookie } = await import('@/app/actions/auth.actions');
        await setSessionCookie(newProfile.id);
        
        router.push('/');
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
            autoComplete="new-password"
            placeholder="Password"
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm Password"
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Button 
          type="submit" 
          className="w-full hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all" 
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Register'}
        </Button>
        <p className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-500 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </form>
  );
}
