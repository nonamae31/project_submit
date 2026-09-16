# Draft Alpha: UI/UX & State Architecture

## 1. Context & Task Analysis
- **Sprint**: Kanban Board - Filter by Assignee.
- **Scope**: 
  - **FE-001**: Build Filter Toolbar (All, My Tasks, Team Member visual list).
  - **FE-002**: Client-side filtering logic, empty state handling (0 count).

## 2. UI/UX Enhancements (Proposals)
Based on Kanban UX design patterns researched:
1. **Avatar Group Quick-Filter**: Instead of a standard `<select>` dropdown, utilize a horizontal list of User Avatars. Applying a filter is a single click. The active avatar should have a distinct visual indicator (e.g., a primary color ring/border). 
2. **URL State Sync (Deep Linking)**: Persist the active filter in the URL query string (e.g., `?assignee=user_123`). This is a massive UX win for project managers who want to share a specific team member's filtered board view via chat or email.
3. **Smooth Filtering Animations**: When a filter is applied, cards should not instantaneously vanish, causing a jarring layout shift. Use a library like `framer-motion` or AutoAnimate to smoothly transition cards out/in.
4. **Explicit Active Filter Chip & Graceful Empty States**: If an assignee has no tasks in a specific column, display a clear empty state (e.g., a dashed dropzone with "0 tasks for [Name]"). Ensure the active filter is highly visible so users don't think their tasks were deleted.

## 3. State Management Architecture
**Proposed Approach: URL-Driven State via Next.js `useSearchParams` + `useMemo`**

Since we are in a Next.js environment, the optimal approach to handle this without prop drilling or unnecessary global stores is to use the URL as the Single Source of Truth.

### Architecture:
- **`FilterToolbar` Component**:
  - Uses Next.js `useSearchParams()` to get the current `assignee`.
  - On avatar click, uses `useRouter` to update the URL: `router.push('?assignee=id', { scroll: false })`.
- **`KanbanBoard` Component**:
  - Holds the master source of truth for tasks (e.g., from an API fetch).
  - Uses `useSearchParams()` to read the `assignee` query parameter.
  - Derives the filtered list purely using `useMemo` to ensure high performance and prevent stale state.
  - The `filteredTasks` array is then distributed into the respective columns.
- **Alternative (Zustand)**:
  - If URL-syncing is rejected, we should use a lightweight Zustand store (`useKanbanFilterStore`) instead of React Context.

## 4. Iron Laws Compliance
- No mock data or fake components are generated; this is purely architectural design.
- We maintain SSOT: The full task list is not mutated; the filtered list is a *derived* state computed on the fly.

