# Draft Beta: Ki?n trúc Hi?u nang & Lu?ng d? li?u (Filter by Assignee)

## 1. Phân tích Lu?ng D? Li?u (Data Flow)
- **Ngu?n d? li?u (Tasks):** Hi?n t?i, component `KanbanBoard` fetch danh sách `tasks` tr?c ti?p t? Supabase và luu vào `useKanbanStore`. Theo type `Task` (t?i `src/types/kanban.types.ts`), m?i task dã ch?a các tru?ng thông tin: `assignee_email`, `assignee_avatar_url`.
- **Ngu?n danh sách thành viên:** Không c?n g?i thêm API l?y danh sách user c?a d? án. Ta có th? **trích xu?t m?ng Unique Members** tr?c ti?p t? m?ng `tasks` hi?n có trong store. Vi?c này giúp gi?m t?i network request và b?o d?m danh sách trên Filter Toolbar ch? ch?a nh?ng ngu?i th?c s? có tham gia vào ít nh?t 1 task trong board.

## 2. Ð? xu?t C?i thi?n Hi?u nang & UX (4 Enhancements)
D?a trên Best Practices c?a React và Next.js v? client-side filtering:

- **Enhancement 1: Ð?ng b? State Filter v?i URL (URL-Driven State)**
  - *V?n d?:* Luu filter b?ng `useState` s? b? m?t khi reload và không th? chia s? link cho ngu?i khác.
  - *Gi?i pháp:* Dùng `useSearchParams`, `useRouter`, và `usePathname` c?a Next.js (ho?c thu vi?n `nuqs`). Ví d? URL: `?assignee=email@domain.com`. Khi load trang, d?c state tr?c ti?p t? query params d? kh?i t?o filter.
  
- **Enhancement 2: T?i uu hoá Render v?i `useMemo` và `React.memo`**
  - *V?n d?:* L?c danh sách hàng tram task liên t?c s? ch?n main thread và làm gi?t lag giao di?n (d?c bi?t khi k?t h?p kéo th? dnd-kit).
  - *Gi?i pháp:* B?c m?ng `filteredTasks` b?ng `useMemo`, ch? tính toán l?i khi `tasks` g?c ho?c `searchParams` thay d?i. Cân nh?c dùng `React.memo` cho các `BoardColumn` và `TaskCard` d? ngan chúng re-render du th?a n?u d? li?u bên trong chúng không b? ?nh hu?ng.

- **Enhancement 3: X? lý Empty State Mu?t Mà (UX)**
  - *V?n d?:* Khi filter, nhi?u c?t có th? không ch?a task nào c?a thành viên dó. N?u d? tr?ng tron, nhìn nhu UI b? l?i.
  - *Gi?i pháp:* Counter c?a c?t ph?i hi?n th? `(0)`. Trong thân c?t c?n render m?t Component Empty State nh? nhàng (vd: bi?u tu?ng m? và dòng ch? "No tasks for this member").

- **Enhancement 4: K? thu?t Debounce cho Search/Filter (M? r?ng tính nang)**
  - *V?n d?:* N?u Toolbar h? tr? tìm ki?m b?ng Text trong tuong lai, gõ phím liên t?c s? spam c?p nh?t URL ho?c re-render.
  - *Gi?i pháp:* B?c thay d?i input vào m?t hàm debounce (kho?ng 300ms) tru?c khi th?c hi?n hành d?ng c?p nh?t state/URL.

