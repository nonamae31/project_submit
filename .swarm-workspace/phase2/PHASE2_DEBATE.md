# PHASE 2 DEBATE LOG
**Chủ đề:** Hội tụ Thiết kế Kiến trúc cho AI Task Management Board

## Round 1: Tổng hợp các đề xuất
- **Architect Alpha:**
  - **State:** RSC cho initial fetch + Zustand cho client UI state. Dnd-kit cho drag & drop.
  - **Security:** Tải file lên Supabase private bucket, dùng SDK tạo Signed URL (60s) để xem file. AI Route Handler với Vercel AI SDK (streaming).
  - **UI/UX:** Nhấn mạnh vào Mobile Adaptive Kanban và AI Streaming.
- **Architect Beta:**
  - **State:** Zustand cho local UI + TanStack Query cho optimistic updates và server state. Dnd-kit cho drag & drop. Khuyến nghị dùng Server Actions thay vì Route Handlers.
  - **Security:** Private Buckets & RLS, sử dụng `auth.uid()` logic. Server Action sinh Signed URL.
  - **UI/UX:** Feature-based folder structure.
- **Architect Gamma:**
  - **State:** RSC cho data fetching + Zustand + Server Actions kết hợp hook `useOptimistic` (React 19/Next 14+) thay vì TanStack Query để giảm bundle size. Dnd-kit.
  - **Security:** Frontend gọi Server Action kiểm tra quyền qua `auth.getUser()`, sau đó sinh Signed URL. AI Summary lưu ở DB đọc bình thường.
  - **UI/UX:** URL-based state cho filters (`nuqs`), Theme-aware board.

## Round 2: Phản biện chéo và Hội tụ (Tri-Consensus)

1. **State Management & Optimistic Updates:**
   - *Quyết định:* Chấp nhận đề xuất của **Gamma**. Việc kết hợp RSC (để fetch data ban đầu), Server Actions (để mutate), và hook `useOptimistic` là chuẩn mực nhất của Next.js App Router hiện tại. TanStack Query (Beta đề xuất) hơi thừa thãi nếu chúng ta đã dùng Server Actions. Zustand chỉ dùng cho UI states thuần tuý (như sidebar open, modal open).
   - *Chốt:* **RSC + Server Actions + `useOptimistic` + Zustand + `@dnd-kit/core`**.

2. **File Security & Access Guard:**
   - *Quyết định:* Đồng thuận giữa cả 3 Architect. File đính kèm sẽ upload thẳng lên Supabase Storage (Private Bucket) từ client sau khi xác thực, nhờ RLS bảo vệ.
   - Khi Leader hoặc Owner click xem/tải file -> gọi **Server Action** để xác minh quyền `role` trong DB. Nếu đúng -> gọi Admin SDK tạo **Signed URL** trả về Client để hiển thị. Nếu User thường click -> Block UI (hoặc báo lỗi Server).
   - Bản tóm tắt AI (Summary) sẽ lưu dưới dạng text vào DB public của team, ai cũng xem được.

3. **AI Route Integration:**
   - *Quyết định:* Sử dụng **Next.js Route Handler (`app/api/ai-evaluate/route.ts`)** (đề xuất của Alpha & Gamma) kết hợp với **Vercel AI SDK** để hỗ trợ tính năng Streaming Response. Backend route này sẽ đọc Signed URL của file doc, tải nội dung về bộ nhớ server, rồi gửi prompt qua AI model (tránh client phải download file text rớt ra ngoài).
   
## Kết luận Debate: HỘI TỤ THÀNH CÔNG (APPROVED)
3 Architect đã thống nhất các quyết định kỹ thuật và list Enhancement (7 mục). Manager tiến hành ghi file ARCHITECTURE_DECISION.md.
