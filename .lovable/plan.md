

## Import Contract Checklist to Tasks

### What it does
Adds an "Import from Contract" button on the Tasks page. When clicked, agents pick a transaction, see its checklist items, and bulk-import them as tasks. Imported tasks carry the same action options available on the Transaction Detail page: **Book Directly**, **We'll handle it**, and **Mark as complete**.

### Changes

**1. New file: `src/components/tasks/ImportFromContractDialog.tsx`**
- Dialog listing active transactions (with listing address)
- On select, shows checklist items grouped by section (skips already-done items)
- Select/deselect individual items before import
- "Import" button creates a task per selected item with `transaction_id`, `listing_id`, `task_type: "todo"`, and `description` set to the checklist section name

**2. New file: `src/components/tasks/TaskActionPanel.tsx`**
- Reusable action dialog matching the Transaction Detail pattern
- Three options: "Book Directly" (sets `handled_by: self`), "We'll handle it" (sets `handled_by: listbar`), "Mark as complete" (toggles done)
- Triggered from the task list row (chevron/action button) or the task detail panel

**3. Edit: `src/pages/Tasks.tsx`**
- Add "Import from Contract" button in the header bar next to filters
- Wire up the `ImportFromContractDialog` with the existing `createMutation`
- Add `TaskActionPanel` dialog state, pass open/close handlers to the task list

**4. Edit: `src/components/tasks/TaskList.tsx`**
- Add an action button (chevron) on each task row that opens the `TaskActionPanel`
- Show a subtle badge/icon on tasks linked to a transaction (e.g. small house icon or "Deal" chip)

**5. Edit: `src/components/tasks/TaskDetail.tsx`**
- Add the same three action buttons ("Book Directly", "We'll handle it", "Mark complete") in the detail panel for tasks linked to a transaction

**6. Database migration**
- Add `handled_by` column (text, nullable) to the `tasks` table — stores `"listbar"` or `"self"`, matching the `transaction_checklist_items` pattern

### Data flow
- Transactions queried with `listings(address)` join for display
- Checklist items queried from `transaction_checklist_items` filtered by selected transaction, `done = false`
- Each imported item becomes a task row: `title` = label, `description` = section, `transaction_id` + `listing_id` set from the transaction
- The `handled_by` field on tasks enables the same Book/Handle/Complete workflow from the transaction page

