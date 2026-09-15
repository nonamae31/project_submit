# QA SUBMISSION REPORT

**Trạng thái**: FAILED

## Các bước thực hiện:
1. Navigate đến `http://localhost:3000/login`.
2. Đăng nhập bằng `hieu123@gmail.com` / `Mypassword@123`.
3. Báo lỗi "Tài khoản hoặc mật khẩu không chính xác".
4. Thử chuyển sang trang `http://localhost:3000/register` để đăng ký tài khoản trên.
5. Đăng ký nhận lỗi "null value in column "id" of relation "profiles" violates not-null constraint" từ database.

## Kết luận:
Không thể hoàn thành bài kiểm thử E2E do không thể đăng nhập hoặc đăng ký tài khoản được yêu cầu. Vui lòng kiểm tra lại database (có vẻ trigger tạo profile bị lỗi hoặc thông tin tài khoản cung cấp bị sai).
