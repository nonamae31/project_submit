import { Metadata } from 'next';
import { ForceChangePasswordForm } from './ForceChangePasswordForm';

export const metadata: Metadata = {
  title: 'Buộc Đổi Mật Khẩu',
  description: 'Bạn phải đổi mật khẩu mặc định để tiếp tục',
};

export default function ForceChangePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-xl dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl">⚠️</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Yêu cầu đổi mật khẩu
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Vì lý do bảo mật, bạn không được phép sử dụng mật khẩu mặc định (123456). Vui lòng đổi mật khẩu mới để tiếp tục.
          </p>
        </div>
        <ForceChangePasswordForm />
      </div>
    </div>
  );
}
