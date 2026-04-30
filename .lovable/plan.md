## Add Assignee + Due Date columns to the Listing Checklist

Right now each checklist row is just a circle and a label. We'll restructure every row into three columns so an agent can scan a listing and instantly see *what's left*, *who owns it*, and *when it's due*.

### The new row layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ MARKETING                                                            │
├────┬────────────────────────────────┬────────────────────┬──────────┤
│ ○  │ Photography scheduled          │ 📷 Mtn View Photo  │ Oct 18   │
│ ●  │ MLS input complete             │ 👤 Me              │ Oct 22   │
│ ○  │ Signage installation           │ + Assign           │ + Date   │
└────┴────────────────────────────────┴────────────────────┴──────────┘
```

- **Left** — the existing done circle (click to complete)
- **Middle** — the task label (unchanged)
- **Right column 1 — Assignee chip**: shows an icon + name. If unassigned, shows a faded "+ Assign" button.
- **Right column 2 — Due date chip**: shows the date. If none, shows a faded "+ Date" button. Goes amber when ≤3 days away, red when overdue.

On mobile, the two right chips stack under the label so nothing wraps awkwardly.

### Assigning someone

Clicking the assignee chip opens a small popover with three tabs:

1. **Me** — the agent themselves (default suggestion)
2. **List Bar** — assigns to the TC team (also creates a linked task in the TC's Tasks queue automatically, so it actually shows up for them)
3. **Vendor** — searchable list of the user's existing vendors from the Vendors table, grouped by category (Photographer, Stager, Sign Co., Inspector, etc.). If the list is empty or the right vendor isn't there, an inline "+ Add new vendor" link opens a quick-add form (name, category, phone/email) without leaving the checklist.

The chip then displays a small icon based on assignee type (person / List Bar logomark / vendor category icon) plus the name, kept short so the row stays one line on desktop.

### Setting a due date

Clicking the date chip opens a shadcn date picker popover. Quick presets at the top: **Today**, **In 3 days**, **Next week**, **On go-live date** (auto-fills from the listing's `listing_date`). Click a preset or pick a custom date.

### Where this surfaces elsewhere

Once each item has an assignee + due date, we can light up the rest of the app:

- **Listings index card** — instead of generic "✓ MLS Photos / ○ Staging," show the next 2 open items as: `MLS input · Me · Oct 22` and `Photography · Mtn View · Oct 18`. Overdue items get a red dot.
- **Dashboard "Deadlines"** — checklist items with a due date in the next 7 days roll up here alongside transaction deadlines, each linking back to its listing.
- **Launch Milestones sidebar** (right column on the listing detail) — a milestone shows a red dot if any of its underlying checklist items are overdue.

### Database changes

Add three columns to `listing_checklist_items`:

| Column | Type | Purpose |
|---|---|---|
| `assignee_type` | text (`self` / `listbar` / `vendor`) | who's handling it; nullable = unassigned |
| `vendor_id` | uuid → `vendors.id` | only set when `assignee_type = 'vendor'` |
| `due_date` | date | optional per-item deadline |

Same three columns added to `transaction_checklist_items` for consistency (it already has a partial `handled_by` text field — we'll migrate that data into the new structured fields and deprecate the old column).

When `assignee_type = 'listbar'`, a Postgres trigger creates a row in `tasks` (assigned_to = TC user, linked back via `listing_id`) so it shows up in the TC's Tasks page automatically.

### Files to change

- DB migration: add the three new columns + the List Bar → tasks trigger
- `src/pages/ListingDetail.tsx` — restructure `ChecklistRow` into the new 4-column layout
- `src/components/listings/AssigneePopover.tsx` (new) — tabbed Me / List Bar / Vendor picker with inline vendor add
- `src/components/listings/DueDatePopover.tsx` (new) — shadcn calendar with presets
- `src/components/dashboard/ListingCard.tsx` — show assignee + due date on the 2-item preview
- `src/pages/Listings.tsx` — same denser preview on the index
- `src/pages/TransactionDetail.tsx` — apply the same row layout for consistency
- DEFAULT_CHECKLIST seed — pre-populate sensible default `assignee_type` per item (Photography → vendor, MLS input → self, Signage → vendor, Listing agreement → self, etc.)

### Open questions

1. **List Bar auto-task**: when an agent assigns an item to "List Bar," should it also create a real task in the TC's Tasks queue (recommended — otherwise the TC has no way to see it without opening every listing)?
2. **Default assignees**: OK to pre-fill the seeded checklist with sensible defaults (Photography → vendor placeholder, MLS input → Me, etc.) so most rows already have an assignee on day one?
3. **Vendor categories**: the Vendor tab will group by `vendors.category`. Do you have a fixed category list you want enforced (Photographer, Stager, Sign Co., Inspector, Cleaner, Handyman, Other), or keep it free-text like it is today?
