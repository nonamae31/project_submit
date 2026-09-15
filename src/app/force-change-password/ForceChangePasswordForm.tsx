'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { clearForceChangePasswordCookie, updateProfilePassword } from '@/app/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

const schema = z.object({
  password: z.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .refine(val => val !== '123456', 'Mật khẩu mới không được trùng mật khẩu mặc định (123456)'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Xác nhận mật khẩu không khớp',
  path: ['confirmPassword']
});

type FormValues = z.infer<typeof schema>;

export function ForceChangePasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);

    try {
      await updateProfilePassword(data.password);
      await clearForceChangePasswordCookie();
      toast.success('Đổi mật khẩu thành công!');
      
      router.push('/');
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Đã xảy ra lỗi không xác định');
      }
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu mới</Label>
          <Input
            id="password"
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            className="hover:bg-accent active:scale-95 focus-visible:ring-2 transition-all"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-red-600 hover:bg-red-700 text-white hover:scale-[1.02] active:scale-95 transition-all" 
        disabled={loading}
      >
        {loading ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}
      </Button>
    </form>
  );
}
