# MASTER ARCHITECTURE: Kanban Filter by Assignee

## 1. M?C TIÊU
Thêm thanh Toolbar l?c Kanban theo Assignee.

## 2. NH?NG ENHANCEMENT (C?I TI?N) ÐU?C Ð? XU?T T? SWARM
### UI / UX (Alpha)
- **E1: Avatar Group Quick-Filter**: Thay vì Select Dropdown nhàm chán, dùng m?t dãy Avatar tròn d? click nhanh.
- **E2: URL-Driven State**: Luu b? l?c vào URL (`?assignee=...`) d? có th? copy link g?i cho ngu?i khác và gi? nguyên b? l?c khi F5.
- **E3: Smooth Filtering Animations**: Dùng Framer Motion / AutoAnimate d? hi?u ?ng l?c không b? gi?t c?c.
- **E4: Column Empty States**: Hi?n th? rõ "(0)" và thông báo "Không có task nào" bên trong c?t.

### Performance (Beta)
- **E5: Unique Members Extraction**: Không c?n g?i API Supabase riêng, t? d?ng duy?t m?ng `tasks` hi?n có d? l?y danh sách thành viên tham gia b?ng.
- **E6: Render Optimization**: B?c `filteredTasks` qua `useMemo` và các `BoardColumn` b?ng `React.memo` d? Kanban không b? lag khi chuy?n filter.

### Edge Cases & Integration (Gamma)
- **E7: Smart Auto-Assign**: Ðang b?t filter cho "Alice", n?u b?m nút "T?o Task" thì h? th?ng t? set Assignee là Alice.
- **E8: Safe D&D with Filters**: Kéo th? task khi dang l?c v?n mu?t mà, ch? d?i Status ch? không thay d?i các state ?n.
- **E9: Global Empty State**: B?m vào 1 ngu?i không có b?t k? vi?c nào, hi?n th? 1 màn hình r?ng to ? gi?a b?ng thay vì 5 c?t r?ng.
- **E10: "Unassigned" Filter**: Thêm m?t m?c l?c riêng d? tìm các task "Chua có ai nh?n".

