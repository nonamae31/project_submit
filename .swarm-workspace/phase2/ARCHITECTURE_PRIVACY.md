# Architecture Design: Editable Task Modal & File Privacy (RBAC)

## 1. Editable Task Modal (UI Re-architecture)
- **Component**: `TaskDetailModal.tsx`
- **Fields**: 
  - `title`: Converted from `<h2>` to `<Input className="text-xl font-bold border-none shadow-none focus-visible:ring-1" />`
  - `description`: Converted from `<p>` to `<Textarea className="resize-none" />`
- **Auto-save Logic**: Add `onBlur` event listeners. When the user clicks outside the input/textarea, trigger a `supabase.from('tasks').update(...)` call. Optionally show a subtle saving indicator.
- **Assignee Dropdown**: 
  - The `MEMBERS` constant is removed.
  - Fetch members from `project_members` based on `task.project_id`. If `project_id` is missing in `Task`, fetch via `columns` -> `boards` or pass it down from `KanbanBoard` -> `TaskDetailModal`.
  - Update `task.assignee` in Supabase upon selection.

## 2. File Privacy Mechanism (RBAC)
- **Database Schema Change**: Add `is_public` (BOOLEAN, default: false) to `tasks` table.
- **Read Access Logic**:
  - The backend (Supabase Storage) ideally uses RLS policies. However, since we are handling this in UI/Frontend logic (and potentially server-side actions), the visibility is determined by:
    1. Is the current user the `assignee`?
    2. Is the current user the Leader of the project? (Check `project_members` role).
    3. Is `is_public === true`?
  - If NONE of these are true, the file section is replaced with: *"🔒 Tài liệu đang ở chế độ riêng tư"*.
- **Toggle Control**:
  - Only visible if the current user's role is `admin` (Leader).
  - A Shadcn `Switch` component: "Công khai tài liệu này cho cả nhóm".
  - Toggling it updates `is_public` in the `tasks` table and refreshes state.

## 3. Data Flow & Security
- **Frontend Enforcement**: The UI hides the link.
- **Backend Enforcement (Recommended)**: To truly secure the file, Supabase Storage RLS should check `tasks.is_public` and `project_members.role`. (Note: Since we are only modifying Next.js, we will implement the UI gatekeeper first, but will warn the user about RLS).
