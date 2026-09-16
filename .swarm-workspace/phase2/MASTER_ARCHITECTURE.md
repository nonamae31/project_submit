# Master Architecture Document: Knowledge Tree & Cloudinary Sync

## 1. Thiết kế Cơ sở dữ liệu (Database Schema)
Sử dụng mô hình đệ quy **Adjacency List** với `parent_id`:

```sql
CREATE TABLE knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    progress SMALLINT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    media_files JSONB DEFAULT '[]'::jsonb, -- Array of { url, public_id, type }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_nodes_parent_id ON knowledge_nodes(parent_id);
```

## 2. Logic Backend & Cảnh báo Sống còn
- **Upload:** File ảnh/video sẽ được đẩy thẳng lên Cloudinary thông qua Server Action (`upload_stream`), lấy `url` và `public_id` lưu vào mảng `media_files` ở node tương ứng.
- **Xóa Đệ Quy:** 
  1. Viết một Supabase RPC function (`get_all_descendants`) sử dụng `WITH RECURSIVE` để quét tất cả node con, cháu, chắt...
  2. Map danh sách toàn bộ các file media của tập hợp node bị ảnh hưởng để lấy danh sách `public_id`.
  3. Gửi Promise.all gọi `cloudinary.uploader.destroy()` và in log theo đúng yêu cầu: `[CLOUDINARY] Đã xóa thành công file: public_id_xxx`.
  4. Cuối cùng, thực hiện xóa node trên DB (nhờ có `ON DELETE CASCADE` ở khóa ngoại `parent_id`, chỉ cần xóa node gốc là xóa luôn toàn bộ con cháu trong database).

## 3. Kiến trúc Frontend (React Flow + Optimistic UI)
- **Giao diện:** Tab 1 (Kanban Board) và Tab 2 (Knowledge Tree Visualize).
- **Thư viện Cây:** Sử dụng `React Flow` (hoặc `xyflow/react`) để vẽ cây trực quan dạng Canvas, có thể kéo thả (pan/zoom), rất phù hợp để làm mindmap hay hệ thống kiến thức phân mảnh.
- **Optimistic UI:** Lưu trữ và quản lý mảng `nodes`, `edges` phẳng cho React Flow bằng `useOptimistic`. Khi người dùng xóa 1 Node, chúng ta dùng thuật toán tìm kiếm (BFS/DFS) trên danh sách kề ở front-end để lọc bỏ ngay lập tức nhánh bị xóa khỏi màn hình, đồng thời gọi Server Action ẩn ngầm. Nếu thất bại, rollback tự động.

## 4. Các Đề xuất Enhancements
1. **E1 - Tối ưu Layout Tự động (Auto-layout Engine)**: Tích hợp thư viện `dagre` để cây tự động phân bổ tọa độ thông minh, không bắt user phải kéo từng ô cho thẳng hàng.
2. **E2 - Trình Xem Trước (Preview Drawer/Modal)**: Xem ảnh/video trực tiếp bên trong Tab bằng 1 panel trượt ra mà không cần tải tab mới.
3. **E3 - Xuất Hình Ảnh Cây (Export to Image)**: Tính năng chụp nhanh sơ đồ cây xuất ra PNG.
4. **E4 - Responsive Mobile Fallback**: Sơ đồ Canvas khó vuốt trên điện thoại. Khi vào Mobile, UI tự chuyển thành danh sách Nested Collapsible List.
5. **E5 - Tìm kiếm (Search & Focus)**: Gõ tìm kiếm và tự động zoom/pan đến đúng ô.
