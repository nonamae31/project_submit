# QA Submission Report 2

**Trạng thái**: FAILED

**Lý do thất bại**: 
Khi người dùng nhập text và click nút "Thêm Text", UI không phản hồi. Kiểm tra Developer Tools cho thấy có lỗi `500 Internal Server Error` từ backend trả về.

Chi tiết lỗi trong Response Body:
`Error: Could not find the 'content' column of 'task_submissions' in the schema cache`

**Các bước đã thực hiện**:
1. Đăng nhập với tài khoản `hieu123@gmail.com` / `Mypassword@123`.
2. Truy cập vào Project Dashboard (`/projects`).
3. Mở Kanban Board của dự án đầu tiên.
4. Click vào task "Test Desc In Progress" để mở modal chi tiết.
5. Chuyển sang tab "Bài nộp (Đa phương tiện)".
6. Nhập văn bản "Đây là bài test nộp text" vào ô nhập ghi chú.
7. Click nút "Thêm Text".
8. Sau khi click, ghi nhận lỗi 500 ở tab Network và lỗi trên UI do backend thiếu column `content` trong bảng `task_submissions`.
