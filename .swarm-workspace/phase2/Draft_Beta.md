# Kiến trúc đề xuất: Chuyển "Mời thành viên" sang Sidebar (Popup Dialog)

**Người viết:** Architect Beta

## 1. Phân tích Component

Để chuyển chức năng "Mời thành viên" sang thanh điều hướng bên trái và hiển thị dưới dạng Popup (Dialog), chúng ta cần thiết kế các component sau:

*   **`InviteMemberDialog.tsx` (Client Component):**
    *   Sử dụng các component của Shadcn UI: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`.
    *   **Nội dung Dialog:** Chứa form nhập email/tên thành viên muốn mời, select box chọn Role (nếu có), và nút Submit (kèm trạng thái loading).
    *   Component này sẽ đóng vai trò là một "wrapper" độc lập, có thể nhận vào một `children` để làm `DialogTrigger` (ví dụ như một menu item của sidebar).

*   **Tích hợp vào Sidebar/Layout (`layout.tsx` hoặc component Sidebar):**
    *   Import `InviteMemberDialog` vào component chứa thanh điều hướng bên trái.
    *   Bọc nút "Mời thành viên" (nằm trong sidebar menu) bằng `InviteMemberDialog`.
    *   Điều này giúp giải phóng hoàn toàn không gian của Kanban Board bên phải, giúp UI thoáng hơn.

## 2. Phân tích State & Dữ liệu

*   **Lấy `projectId`:**
    *   Thanh điều hướng bên trái thường nằm trong layout cụ thể của project (ví dụ: `app/projects/[projectId]/layout.tsx`).
    *   Sử dụng Hook `useParams` từ `next/navigation` bên trong `InviteMemberDialog` (hoặc truyền từ component cha xuống) để lấy `projectId` hiện tại:
        ```typescript
        "use client"
        import { useParams } from "next/navigation";

        // ... bên trong component
        const params = useParams<{ projectId: string }>();
        const projectId = params?.projectId;
        ```
    *   **Lưu ý:** Vì dùng hook `useParams`, component `InviteMemberDialog` bắt buộc phải là **Client Component**.

*   **Quản lý State trong form:**
    *   `isOpen` (boolean): Quản lý trạng thái mở/đóng của Dialog (dùng controlled state `open` và `onOpenChange` của Shadcn Dialog để tự động đóng popup khi api call thành công).
    *   `email` (string): State lưu trữ thông tin input người dùng.
    *   `isSubmitting` (boolean): Trạng thái loading khi gọi API (hiệu ứng spinner trên nút, disable nút submit để tránh double-click).

## 3. Các Đề xuất Cải tiến (Enhancements)

Dựa trên các góc nhìn chuyên gia frontend, tôi đề xuất thêm các Enhancement sau:

*   **UX Manager & Customer (Trải nghiệm nhanh & mượt):**
    *   **Feedback tức thời:** Sử dụng `toast` hoặc `sonner` để hiển thị thông báo "Đã gửi lời mời thành công" hoặc báo lỗi (ví dụ: email không tồn tại).
    *   **Tối ưu thao tác:** Tự động focus vào input email ngay khi mở Dialog. Cho phép bấm phím `Enter` để submit form thay vì phải trỏ chuột vào nút.

*   **Accessibility (Khả năng tiếp cận):**
    *   Đảm bảo có `DialogTitle` và `DialogDescription` bên trong `DialogContent` để hỗ trợ Screen Reader.
    *   Focus trap (giữ focus bên trong dialog khi đang mở) và hỗ trợ phím `Esc` để đóng (Shadcn đã có sẵn nhưng cần đảm bảo không bị vô hiệu hóa).

*   **Responsive (Tương thích thiết bị):**
    *   Trên Desktop: Hiển thị dạng Popup Modal ở giữa màn hình.
    *   Trên Mobile: Có thể sử dụng kết hợp `Dialog` (Desktop) và `Drawer` (Mobile) của Shadcn UI để tạo trải nghiệm "vuốt từ dưới lên" tự nhiên hơn cho người dùng điện thoại.
