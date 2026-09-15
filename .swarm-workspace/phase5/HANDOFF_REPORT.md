# HANDOFF REPORT: EDITABLE TASK MODAL & PRIVACY RBAC

## 1. Thành quả Code
- **Editable Task Modal:** `TaskDetailModal.tsx` đã được cấu trúc lại hoàn toàn. Tiêu đề và mô tả sử dụng thẻ `<Input>` và `<Textarea>` của Shadcn UI, hỗ trợ auto-save qua sự kiện `onBlur`. 
- **Assignee Dropdown:** Đã thay thế mảng tĩnh `MEMBERS` bằng truy vấn trực tiếp từ `project_members`, cập nhật ngay xuống Supabase khi select.
- **Privacy Mechanism:** 
  - Đã tích hợp cờ `is_public` (yêu cầu schema DB có cột này ở bảng `tasks`).
  - Logic phân quyền: Chỉ Assignee, Leader, hoặc khi cờ `is_public == true` mới được xem file. Nếu không, file sẽ bị thay thế bằng thông báo: *"🔒 Tài liệu đang ở chế độ riêng tư"*.
  - Nút Switch "Công khai tài liệu" chỉ hiển thị cho người có role `admin` (Leader).

## 2. Kết quả Testing
- Build Next.js hoàn thành (0 lỗi Type).
- Đã tạo test user (đã gặp rate limit ở user số 3 và 4 nhưng 2 user đầu đã sẵn sàng cho test).
- QA Subagent đã xác nhận UI render chuẩn.

## 3. Chú ý (Caveats)
- User phải chạy lệnh SQL tạo cột `is_public` trong bảng `tasks`.
- Do Supabase Rate Limit, 2 tài khoản cuối chưa được tạo.
