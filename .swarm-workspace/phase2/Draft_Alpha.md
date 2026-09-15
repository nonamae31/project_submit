# Architect Alpha - Phase 2 Draft Proposal

## 1. Phân tích Yêu cầu
- **Mục tiêu**: Đưa tính năng "Mời thành viên" (Invite Member) sang thanh điều hướng bên trái (layout) và mở dưới dạng Popup (Dialog).
- **Lợi ích**: Giải phóng 100% không gian màn hình chính cho Kanban Board, giúp UI gọn gàng, người dùng tập trung hoàn toàn vào công việc quản lý thẻ/task.

## 2. Phân tích Component & Kiến trúc
Để giữ cho `layout.tsx` (thường là Server Component trong Next.js App Router) tối ưu và không bị ép thành Client Component, chúng ta sẽ áp dụng pattern **Component Composition** và **Lazy Loading**.

### 2.1. Cấu trúc Component
- `app/(main)/layout.tsx`: **Server Component**. Chứa bộ khung layout, render thanh điều hướng bên trái (`Sidebar` hoặc `LeftNav`) như một thành phần con.
- `components/layout/Sidebar.tsx`: **Client Component** (có `"use client"`). Chứa các item điều hướng và nút "Mời thành viên".
- `components/members/InviteMemberDialog.tsx`: **Client Component**. Chứa UI của Popup (Dialog), form nhập liệu (email/role), và logic gửi API lời mời.

### 2.2. Quản lý State (Trạng thái Dialog)
Có 2 phương án quản lý state cho việc đóng/mở Dialog:
- **Phương án 1 (Khuyên dùng) - URL-driven State (`?invite=true`)**: Sử dụng query parameter để điều khiển trạng thái mở của Dialog (thông qua `nuqs` hoặc `useSearchParams`).
  - *Ưu điểm*: Có thể chia sẻ link trực tiếp để mở dialog (deep linking), dễ dàng tích hợp với các action từ Server (ví dụ server action redirect kèm query).
- **Phương án 2 - Local State (`useState`)**: Đặt state `isOpen` ngay trong `Sidebar.tsx`.
  - *Ưu điểm*: Nhanh gọn, đóng gói tốt (encapsulation).

**Đề xuất của Alpha**: Sử dụng **Local State (`useState`)** ngay trong `Sidebar.tsx` kết hợp render Dialog tại đây nếu nút "Mời thành viên" chỉ nằm ở Sidebar. Nếu muốn mở Popup từ nhiều nơi khác nhau (vd: Header, phím tắt), nên nâng cấp lên Zustand hoặc URL State.

## 3. Các Enhancement Đề Xuất (Theo 7 Góc Nhìn Frontend)
Để mang lại chất lượng Code và Trải nghiệm Tốt nhất, Alpha đề xuất các cải tiến sau:

1. **SEO & Performance**:
   - Sử dụng `next/dynamic` để lazy-load `InviteMemberDialog` vào `Sidebar`. Tính năng mời thành viên không phải là tính năng dùng ngay khi mới load trang, nên việc tách bundle (`ssr: false`) sẽ giúp giảm đáng kể kích thước JS khởi tạo và tăng tốc độ TTI (Time to Interactive).
   ```tsx
   const InviteMemberDialog = dynamic(() => import('@/components/members/InviteMemberDialog'), { ssr: false });
   ```

2. **UX Customer (Trải nghiệm người dùng mượt mà)**:
   - Sử dụng `shadcn/ui` (Radix UI Dialog) hoặc Framer Motion để có hiệu ứng fade-in mượt mà, hỗ trợ Focus Trap (giữ focus phím tab trong popup) và đóng popup khi click ra ngoài overlay (Click Outside) hoặc nhấn phím `Escape`.

3. **UX Manager (Hiệu suất làm việc)**:
   - Hỗ trợ nhập liệu thông minh: Form cho phép copy-paste nhiều email cùng lúc (phân cách bằng dấu phẩy) và chuyển thành UI "Tags" (Multi-select) để mời nhiều người trong một thao tác duy nhất.
   - Hỗ trợ phím tắt (Keyboard Shortcut): Nhấn `I` hoặc `Ctrl + I` để mở nhanh Dialog từ bất kỳ đâu.

4. **Responsive (Thích ứng đa thiết bị)**:
   - Trên Desktop: Hiển thị Dialog (Modal) căn giữa màn hình với backdrop mờ (`backdrop-blur`).
   - Trên Mobile: Hiển thị dưới dạng Bottom Sheet (vuốt từ dưới lên) để người dùng dễ thao tác bằng một tay. (Có thể dùng thư viện `vaul`).

5. **Accessibility (Tiếp cận chuẩn a11y)**:
   - Component phải có đủ thuộc tính `role="dialog"`, `aria-labelledby`, `aria-describedby`.
   - Auto-focus vào ô input nhập Email ngay khi Dialog vừa mở ra.

6. **Internationalization (i18n)**:
   - Mọi text tĩnh trong Dialog (Tiêu đề, Mô tả, Placeholder, Label nút bấm) cần được thiết kế sẵn để bọc trong các hàm dịch (ví dụ `t('invite_member.title')`) chuẩn bị cho việc đa ngôn ngữ.

7. **Dark Mode & Theming**:
   - Giao diện Dialog phải kế thừa các CSS tokens của hệ thống (Tailwind classes), đảm bảo tự động chuyển đổi nền, viền và chữ khi người dùng switch giữa Dark Mode và Light Mode.

---
**Tóm tắt**: Đưa "Mời thành viên" vào Sidebar + Popup (Lazy load) là một quyết định kiến trúc đúng đắn. Nó không những trả lại không gian làm việc rộng rãi cho Kanban Board mà còn tối ưu hiệu năng tổng thể của ứng dụng nếu áp dụng đúng kỹ thuật Dynamic Import.
