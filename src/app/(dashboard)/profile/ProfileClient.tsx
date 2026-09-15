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

const passwordSchema = z.object({
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z.string().min(6, "Xác nhận mật khẩu tối thiểu 6 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function ProfileClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      age: 18,
      student_id: "",
      phone: "",
      bio: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
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
        profileForm.reset({
          full_name: data.full_name || "",
          age: data.age || 18,
          student_id: data.student_id || "",
          phone: data.phone || "",
          bio: data.bio || "",
        });
      }
    }
    loadProfile();
  }, [userId, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", userId);

      if (error) throw error;
      toast.success("Cập nhật thông tin thành công");
    } catch (error: any) {
      toast.error("Cập nhật thất bại: " + error.message);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) throw error;
      
      toast.success("Đổi mật khẩu thành công!");
      passwordForm.reset();
    } catch (error: any) {
      toast.error("Đổi mật khẩu thất bại: " + error.message);
    }
  };

  const isProfileSubmitting = profileForm.formState.isSubmitting;
  const isPasswordSubmitting = passwordForm.formState.isSubmitting;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex space-x-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Thông tin cá nhân
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`pb-2 px-1 font-medium text-sm transition-colors border-b-2 ${
            activeTab === "password"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400"
          }`}
        >
          Đổi mật khẩu
        </button>
      </div>

      {activeTab === "profile" && (
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Họ và tên</Label>
            <Input id="full_name" {...profileForm.register("full_name")} />
            {profileForm.formState.errors.full_name && (
              <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.full_name.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Tuổi</Label>
              <Input id="age" type="number" {...profileForm.register("age", { valueAsNumber: true })} />
              {profileForm.formState.errors.age && (
                <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.age.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="student_id">Mã SV</Label>
              <Input id="student_id" {...profileForm.register("student_id")} />
              {profileForm.formState.errors.student_id && (
                <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.student_id.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" {...profileForm.register("phone")} />
            {profileForm.formState.errors.phone && (
              <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="bio">Giới thiệu</Label>
            <Input id="bio" {...profileForm.register("bio")} />
            {profileForm.formState.errors.bio && (
              <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.bio.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isProfileSubmitting}>
            {isProfileSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      )}

      {activeTab === "password" && (
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="password">Mật khẩu mới</Label>
            <Input id="password" type="password" {...passwordForm.register("password")} />
            {passwordForm.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.password.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input id="confirmPassword" type="password" {...passwordForm.register("confirmPassword")} />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isPasswordSubmitting}>
            {isPasswordSubmitting ? "Đang đổi..." : "Đổi mật khẩu"}
          </Button>
        </form>
      )}
    </div>
  );
}
