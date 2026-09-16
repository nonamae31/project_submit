# Draft_Gamma: Integration & Edge Cases (Architect Gamma)
**Sprint:** B? l?c Kanban theo Thành viên (Filter by Assignee)

## 1. Ð? xu?t Enhancements (UX & Integration)
- **Enhancement 1: Auto-assign khi t?o Task m?i trong ch? d? l?c.**
  N?u ngu?i dùng dang b?t filter cho thành viên "Alice" và b?m nút "Add Task", task m?i s? t? d?ng du?c gán (auto-assign) cho "Alice" thay vì d? tr?ng.
- **Enhancement 2: T?i uu Drag & Drop khi danh sách b? l?c.**
  Khi kéo th? (Drag & Drop) m?t task gi?a các c?t, logic `onDragEnd` s? tìm ID và c?p nh?t tr?c ti?p vào State g?c. Hành d?ng kéo th? này **ch? thay d?i tr?ng thái c?t (status)**, không làm m?t ngu?i du?c giao.
- **Enhancement 3: Contextual Empty States cho C?t.**
  Thay vì hi?n th? m?t c?t tr?ng tron vô h?n ho?c câu báo l?i khô khan khi m?t ngu?i dùng không có task nào ? tr?ng thái dó, c?t s? hi?n th? m?t thông di?p thân thi?n: *"Alice chua có task nào ? dây."* kèm theo nút "Thêm task".
- **Enhancement 4: Animated Filtering (Tr?i nghi?m th? giác).**
  S? d?ng transition animation d? các th? không kh?p m? d?n (fade out) và các th? kh?p tru?t mu?t mà vào v? trí.

## 2. X? lý Edge Cases
- **Edge Case 1: Tru?ng nhóm xem b?ng.**
  Thanh Filter Toolbar b?t bu?c ph?i có tùy ch?n **"Unassigned"** (Chua phân công) bên c?nh "All".
- **Edge Case 2: Ch?n m?t thành viên không có b?t k? task nào trên toàn b? b?ng.**
  Thay vì v?n render các c?t tr?ng, khu v?c b?ng hi?n th? m?t Global Empty State: *"Alice hi?n t?i chua du?c giao công vi?c nào."*
- **Edge Case 3: Kéo th? vào m?t c?t dang tr?ng tron do b? l?c.**
  Ð?m b?o Component c?a C?t (Column) luôn du?c wrap b?ng `Droppable` v?i `min-height` d?y d? bao ph? chi?u cao c?a c?t.
- **Edge Case 4: Thay d?i Assignee c?a Task tr?c ti?p trong khi Filter dang b?t.**
  Task dó s? không còn kh?p v?i filter và c?n du?c animation tru?t ra kh?i b?ng.

