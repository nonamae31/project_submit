## I. CORE REQUIREMENTS (Từ yêu cầu user — BẮT BUỘC thực hiện)
- Chuyển mục "Mời thành viên" (Invite Members) sang thanh điều hướng bên trái (`layout.tsx`).
- Mở tính năng dưới dạng Popup (Dialog) để giải phóng 100% diện tích cho Kanban Board.
- Tối ưu Performance: Sử dụng Dynamic Import (Lazy loading) cho component `MemberManager` để không làm nặng Layout chung.

## II. ENHANCEMENT PROPOSALS (Từ nghiên cứu — USER CHỌN)
> ⚠️ Đề xuất từ nghiên cứu + Góc Nhìn Chuyên Gia Frontend.
> User chọn ALL, SOME, hoặc NONE.

### Danh sách Enhancement
| # | Góc nhìn | Enhancement | Mô tả | Lý do | Nguồn | Effort | Chọn? |
|---|---|---|---|---|---|---|---|
| E1 | ⚡ UX Manager | URL-Driven Modal | Sử dụng URL Search Params (vd: `?dialog=invite`) hoặc Intercepting Routes để quản lý trạng thái mở Dialog thay vì dùng `useState`. | Hỗ trợ Deep linking, có thể copy URL share trực tiếp và refresh không bị mất popup. | Kiến thức chuyên gia / Next.js Docs | Trung bình | ☐ |
| E2 | ✨ UX Customer | Multi-Email "Chip" Input | Cho phép nhập nhiều email cùng lúc dưới dạng "chips" (tags) có thể xoá nhanh bằng phím Backspace. | Tiết kiệm thao tác khi người dùng cần mời một danh sách dài các thành viên vào dự án. | SaaS UX Patterns | Nhỏ | ☐ |
| E3 | ⚡ UX Manager | Quick "Copy Invite Link" | Bổ sung nút copy Invite Link trực tiếp bên cạnh form gửi email. | Tăng tính linh hoạt, người dùng có thể gửi link qua Slack/Zalo thay vì chờ email hệ thống. | SaaS Feature Comparison | Nhỏ | ☐ |
| E4 | ✨ UX Customer | Role Selector kèm Tooltip | Cho phép gán ngay Role (Admin, Member, Viewer) khi mời, có kèm tooltip giải thích quyền hạn. | Tránh cấp nhầm quyền và tiết kiệm bước phân quyền sau khi thành viên tham gia. | SaaS UX Patterns | Nhỏ | ☐ |
| E5 | ♿ Accessibility | Focus Trapping & ARIA | Dùng Radix UI / shadcn (hoặc Headless UI) để giam focus bên trong modal và đóng bằng phím ESC. | Hỗ trợ người dùng keyboard-only và screen reader, tránh lỗi focus lọt xuống Kanban board. | WCAG 2.1 | Nhỏ | ☐ |
| E6 | 📱 Responsive | Bottom Sheet cho Mobile | Tự động chuyển Modal thành Bottom Sheet vuốt từ dưới lên khi dùng trên màn hình nhỏ. | Tối ưu trải nghiệm ngón tay cái (thumb-zone) trên mobile tốt hơn Modal ở giữa màn hình. | Mobile UX Patterns | Trung bình | ☐ |
| E7 | 🔍 SEO & Web Perf | Skeleton Loading | Hiển thị Skeleton mờ mờ hình form trong lúc chờ tải script `MemberManager` qua dynamic import. | Chặn layout shift (CLS), cho cảm giác phản hồi tức thời ngay sau khi click. | Web Vitals / Core UX | Nhỏ | ☐ |

## III. ARCHITECTURE (Phase 2 - Phân tích & Đề xuất Kỹ thuật)

### 1. Phân tích Component
Vì Layout thường là Server Component trong Next.js App Router, chúng ta không nên đưa toàn bộ state vào `layout.tsx`. Giải pháp là tách riêng nút bấm và Dialog thành các Client Component độc lập.

- **`InviteButton.tsx` (Client Component):**
  - Được nhúng vào thanh điều hướng bên trái (`LeftNav` / `Sidebar`).
  - Gắn sự kiện onClick để thay đổi URL Query (vd: `router.push('?dialog=invite')`) hoặc bật global state.

- **`MemberManagerDialog.tsx` (Thành phần chính):**
  - Chứa UI Dialog (Shadcn/UI hoặc Radix) và Form mời.
  - Sử dụng Server Actions để xử lý logic gửi email nhằm giữ client bundle nhỏ gọn.

- **`DynamicMemberManager.tsx` (Lazy Wrapper):**
  - Nơi gọi `next/dynamic` để tải code của Dialog.
  - Đoạn code mẫu tối ưu:
    ```tsx
    'use client';
    import dynamic from 'next/dynamic';
    import { useSearchParams } from 'next/navigation';

    const MemberManagerDialog = dynamic(
      () => import('@/components/Members/MemberManagerDialog'),
      {
        ssr: false, // Tắt Server-side Rendering cho Modal
        loading: () => <div className="loading-skeleton-modal">...</div>
      }
    );

    export function InviteModalContainer() {
      const searchParams = useSearchParams();
      const showInvite = searchParams.get('dialog') === 'invite';

      if (!showInvite) return null; // Không render gì nếu chưa mở

      return <MemberManagerDialog />;
    }
    ```

### 2. Quản lý State
Thay vì dùng `useState` local gây khó khăn nếu có nhiều chỗ muốn mở Modal (ví dụ: nút "Mời" trong bảng Kanban, nút "Mời" ở LeftNav), ta nên sử dụng **URL Search Params** làm Single Source of Truth cho UI State này:
- Mở popup: `<Link href="?dialog=invite">` hoặc `router.push('?dialog=invite')`.
- Đóng popup: `router.back()` hoặc xóa param khỏi URL.
Điều này giúp luồng hoạt động mượt mà với tính năng History Back của trình duyệt.

### 3. Tối ưu Performance (Triệt để 100%)
- **Zero-Bundle-Bloat Layout:** Bằng cách gói `MemberManagerDialog` qua `next/dynamic` (`ssr: false`), toàn bộ thư viện liên quan (react-hook-form, zod, component bảng biểu) chỉ được tải về browser **sau khi** người dùng click vào nút "Mời". Layout chung không bị "cõng" thêm hàng chục KB JavaScript.
- Kích thước Kanban Board (phần nặng nhất của ứng dụng) giờ đây được dồn toàn lực xử lý mà không bị chia sẻ tài nguyên tính toán với phần Invite lúc khởi tạo trang.
