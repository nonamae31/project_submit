"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  full_name: z.string().min(1, "Tên không được để trống"),
  age: z.number().min(1, "Tuổi phải lớn hơn 0"),
  student_id: z.string().min(1, "Mã SV không được để trống"),
  phone: z.string().min(1, "SĐT không được để trống"),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(6, "Xác nhận mật khẩu tối thiểu 6 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  
  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      age: 0,
      student_id: "",
      phone: "",
      bio: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (data && !error) {
        resetProfile({
          full_name: data.full_name || "",
          age: data.age || 0,
          student_id: data.student_id || "",
          phone: data.phone || "",
          bio: data.bio || "",
        });
      }
    }
    loadProfile();
  }, [userId, resetProfile]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId);

    if (error) {
      toast.error("Cập nhật thất bại: " + error.message);
    } else {
      toast.success("Cập nhật thông tin thành công");
    }
  };

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });



  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      const { updateProfilePassword } = await import('@/app/actions/auth.actions');
      await updateProfilePassword(data.password);
      toast.success("Đổi mật khẩu thành công!");
      resetPassword();
    } catch (error: any) {
      toast.error("Đổi mật khẩu thất bại: " + error.message);
    }
  };

  return (
    <div className="w-full">
      {/* Tabs Header */}
      <div className="flex space-x-1 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab("info")}
          type="button"
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "info"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("password")}
          type="button"
          className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "password"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Đổi mật khẩu
        </button>
      </div>

      {/* Profile Form Tab */}
      {activeTab === "info" && (
        <div className="space-y-6">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên</Label>
              <Input id="full_name" {...registerProfile("full_name")} />
              {profileErrors.full_name && (
                <p className="text-sm text-red-500">{profileErrors.full_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Tuổi</Label>
                <Input id="age" type="number" {...registerProfile("age", { valueAsNumber: true })} />
                {profileErrors.age && (
                  <p className="text-sm text-red-500">{profileErrors.age.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_id">Mã SV</Label>
                <Input id="student_id" {...registerProfile("student_id")} />
                {profileErrors.student_id && (
                  <p className="text-sm text-red-500">{profileErrors.student_id.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" {...registerProfile("phone")} />
              {profileErrors.phone && (
                <p className="text-sm text-red-500">{profileErrors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Giới thiệu</Label>
              <textarea
                id="bio"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...registerProfile("bio")}
              />
              {profileErrors.bio && (
                <p className="text-sm text-red-500">{profileErrors.bio.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isProfileSubmitting}>
              {isProfileSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </form>
        </div>
      )}

      {/* Password Form Tab */}
      {activeTab === "password" && (
        <div className="space-y-6">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input id="password" type="password" {...registerPassword("password")} />
              {passwordErrors.password && (
                <p className="text-sm text-red-500">{passwordErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input id="confirmPassword" type="password" {...registerPassword("confirmPassword")} />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-red-500">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? "Đang đổi..." : "Đổi mật khẩu"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
