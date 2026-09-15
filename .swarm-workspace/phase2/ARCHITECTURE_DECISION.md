# MASTER ARCHITECTURE DECISION DOC
**Project:** AI Task Management Board

## 1. TECH STACK & CORE LIBRARIES
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand (Client UI State) + `useOptimistic` (Optimistic Updates) + Server Actions (Mutations) + `nuqs` (URL State cho Filters).
- **Drag & Drop:** `@dnd-kit/core`
- **Database & Auth:** Supabase Auth, Supabase Postgres, Supabase Storage
- **AI Integration:** Vercel AI SDK (cho Streaming UI) + Local/OpenAI LLM API.

## 2. SYSTEM ARCHITECTURE

### A. Data Fetching & State
- **Server-First:** Sử dụng Server Components (RSC) ở trang `board/page.tsx` để fetch Board, Columns, Tasks, và Team data từ Supabase ở initial load.
- **Mutations:** Mọi thay đổi dữ liệu (tạo task, đổi cột, upload file) đều đi qua **Server Actions**.
- **Optimistic Drag & Drop:** Khi Member kéo TaskCard sang cột mới, dùng `useOptimistic` để cập nhật UI ngay lập tức. Sau đó Server Action chạy ngầm để update column_id vào database. Nếu thất bại, tự rollback.

### B. Security & Privacy Guard (Task Submissions)
- **Upload Flow:** Member upload qua Supabase JS Client trực tiếp lên `task_attachments` (Private Bucket). Policy RLS: `auth.uid() = submitter_id` (chỉ người tạo được insert/update).
- **View/Download Flow:** Các File hiển thị dưới dạng icon khóa. Khi click, gọi Server Action `getSignedFileUrl(fileId)`. Server Action check quyền: nếu requester là Team Leader hoặc Owner của file (hoặc Task.is_public == true), tạo Signed URL (60 giây hạn dùng) trả về. Nếu sai quyền, throw Error.
- **AI Summary:** Kết quả tóm tắt của AI được lưu thẳng vào cột `ai_summary` của bảng `tasks` (hoặc `task_submissions`), được load công khai như thông tin task bình thường.

### C. AI Evaluation Workflow
1. Leader bấm "Chạy AI Đánh Giá" trên file nộp.
2. Request gửi tới `app/api/ai-evaluate/route.ts` kèm `fileId` và `taskId`.
3. Route Handler lấy nội dung file từ Supabase (dùng service role / admin SDK đọc file).
4. Parse nội dung (txt/md/pdf) và đưa vào Prompt kèm theo Title/Description của Task.
5. Gửi lên AI Model.
6. Trả kết quả về Frontend dưới dạng **Streaming** qua Vercel AI SDK, render real-time.
7. Khi AI generate xong trọn vẹn, gọi Server Action lưu kết quả vào `ai_evaluation`.

## 3. SELECTED ENHANCEMENTS
*(Các Enhancement này sẽ được đưa vào file frontend_tasks.json để thi công)*
1. **[E1] Optimistic UI Updates cho Drag & Drop:** Mượt mà như Trello.
2. **[E2] URL-based State cho Filters:** Lọc task theo Assignee/Status trên thanh URL.
3. **[E3] Signed URLs qua Server Actions:** Ẩn hoàn toàn access gốc của Storage.
4. **[E4] Board Horizontal Scroll trên Mobile:** Responsive UX.
5. **[E5] AI Streaming Response UI:** Giảm cảm giác chờ đợi.
6. **[E6] Accessible Drag & Drop (`dnd-kit`):** Keyboard support.
7. **[E7] Theme-Aware Board UI:** Dark mode support.

## 4. DIRECTORY STRUCTURE RULES
- Theo Next.js App Router convention:
  - `app/api/` cho Route Handlers (AI).
  - `app/(dashboard)/` cho Private routes (cần Auth).
  - `components/` phân chia theo features (`board`, `task`, `team`).
  - `actions/` chứa toàn bộ Server Actions.
