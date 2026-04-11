

## Tasks Manager — Build Plan

Based on your reference screenshots (Todoist-style), here's the plan for a clean, modern task manager.

### Database Changes

**Modify `tasks` table** — add columns:
- `task_type` enum: `todo`, `email`, `call`, `meeting`, `follow_up`, `document`
- `parent_task_id` (uuid, nullable, self-referencing) — enables subtasks
- `contact_id` (uuid, nullable) — link to contacts table

The existing columns already cover: `title`, `description`, `status` (todo/in_progress/done), `priority` (low/normal/high/urgent), `due_date`, `listing_id`, `transaction_id`, `order_id`, `assigned_to`, `completed_at`.

### UI — Two-Panel Layout (like your screenshots)

**Left panel — Task list**
- Quick-add input at top ("What needs to be done?")
- Tasks grouped by status: active tasks on top, "Completed" collapsible section at bottom
- Each row: checkbox, task type icon, title, due date (red if overdue), priority indicator, three-dot menu
- Filter bar: by type, priority, linked entity, overdue toggle

**Right panel — Task detail** (appears when a task is selected)
- Title (editable inline)
- Description (editable)
- Metadata chips: Due Date, Priority, Task Type
- "Related to" picker — tabs for Business Tracker (listings/transactions) and Contacts, with search (matching your first screenshot)
- Subtasks section: checklist of child tasks with inline add, each with its own checkbox

### Components to Create

| File | Purpose |
|------|---------|
| `src/pages/Tasks.tsx` | Main page with two-panel layout |
| `src/components/tasks/TaskList.tsx` | Left panel: grouped task list |
| `src/components/tasks/TaskDetail.tsx` | Right panel: selected task view |
| `src/components/tasks/TaskQuickAdd.tsx` | Inline task creation input |
| `src/components/tasks/SubtaskList.tsx` | Checklist of subtasks within detail |
| `src/components/tasks/RelatedToPicker.tsx` | Popover to link task to listing/transaction/contact |

### Modifications

- `src/App.tsx` — swap placeholder route for real Tasks page
- Dashboard "Upcoming Deadlines" — wire to real task data (optional, can do later)

### Interaction Details

- Clicking a task in the list opens the detail panel on the right
- Checking a task checkbox marks it done with a strikethrough animation
- Subtasks are stored as tasks with `parent_task_id` set — same table, recursive
- "Related to" popover searches listings, transactions, and contacts in tabbed view
- Task type shows as a colored icon (phone for call, envelope for email, etc.)

No drag-and-drop initially — status changes via dropdown or checkbox. Clean, minimal, Todoist-inspired.

