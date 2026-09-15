# QA SUBMISSION REPORT FINAL

**Mục tiêu Test:** Nghiệm thu tính năng "Nộp bài đa phương tiện" (Task Submissions).
**Công cụ sử dụng:** `chrome-devtools-mcp`

## Các bước đã thực hiện:
1. Navigate đến `/login` và đăng nhập thành công với tài khoản `hieu123@gmail.com`.
2. Truy cập vào Project Dashboard / Kanban Board (`/projects/d0dc27b1-e088-4202-85b8-b1089a3b7ef9/board`).
3. Click vào Task có tên "Test Desc In Progress" để mở Modal chi tiết.
4. Chuyển sang tab "Bài nộp (Đa phương tiện)".
5. Nhập chuỗi `"Đây là bài test nộp text lần 3"` vào ô nhập ghi chú và click nút **"Thêm Text"**.
6. Đợi và kiểm tra lại UI để xem nội dung có hiển thị không.

## Kết quả kiểm thử:
- **Trạng thái:** ❌ **FAILED**
- **Mong đợi:** Giao diện (UI) hiển thị text mới thêm (do đã fix cache) và xóa trắng ô input.
- **Thực tế:** UI **KHÔNG** render đoạn text mới được thêm. Dòng chữ trạng thái `"Chưa có bài nộp nào."` vẫn hiển thị, đồng thời giá trị trong input textbox không bị xoá bỏ mà vẫn nguyên nội dung đã nhập.
- **Chi tiết kỹ thuật bổ sung:** Phân tích từ Console và Network requests cho thấy khi ấn nút, hệ thống thực hiện một POST request (Server Action) và nhận về lỗi HTTP 500 (Internal Server Error). Dù đã "fix cache", nhưng vì lỗi 500, state cập nhật của UI dường như bị kẹt (optimistic update chưa hoạt động thành công hoặc server action văng exception trước khi revalidate).

## Kết luận:
Tính năng nộp text chưa qua bước kiểm thử UI do sau khi thao tác, màn hình không cập nhật để hiển thị kết quả.
