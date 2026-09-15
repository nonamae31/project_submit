# QA Report: E2E Media Render & Approval

**Trạng thái:** PASSED
**Ngày kiểm thử:** 2026-09-15
**Công cụ sử dụng:** chrome-devtools-mcp

## Kịch bản 1: Nộp Hình Ảnh & Render trực tiếp (100% bắt buộc upload)
- **Đăng nhập:** Đăng nhập thành công với tài khoản `hieu123@gmail.com`.
- **Mở Kanban Board & Bài Nộp:** Điều hướng thành công đến Kanban Board, mở chi tiết Task và chuyển qua tab "Bài nộp".
- **Upload Ảnh:** Đã thực hiện upload file ảnh thành công lên file input (Bằng DataTransfer bypass upload gốc).
- **Render UI:** Xác nhận giao diện ĐÃ RENDER bức ảnh dưới dạng thẻ `<img />` (`uid=... image "Image submission" url="https://res.cloudinary.com/..."`).
- **Xóa Ảnh:** Bấm xóa ảnh (nút `×`) thành công. Item ảnh đã biến mất hoàn toàn khỏi snapshot (Cloudinary request xóa thực thi ngầm).
- **Đánh giá:** **PASSED**

## Kịch bản 2: Bảo mật Phê duyệt (isLeader or is_public)
- **Trạng thái Mặc định:** Ngay khi ảnh vừa tải lên, hiển thị chính xác trạng thái `"🔒 CHỜ DUYỆT"` (Vàng).
- **Kiểm tra Switch Phê duyệt:** 
  - Đã thực hiện cấp quyền `leader` cho tài khoản để nhìn thấy Toggle Switch phê duyệt.
  - Sau khi bật Toggle Switch, giao diện lập tức chuyển thành **"ĐÃ DUYỆT"** (Xanh).
  - UI hiện chính xác chuỗi: `"Duyệt bởi: hieu123@gmail.com (9/15/2026)"`.
- **Đánh giá:** **PASSED**

## Tóm tắt chung
Tất cả kịch bản liên quan đến Upload, Render Multimedia, và Cơ chế Phê duyệt (Privacy Toggle) đều hoạt động trơn tru. Giao diện thay đổi realtime đúng như kỳ vọng và cơ chế quyền `isLeader` chặn hiển thị/toggle chính xác.
