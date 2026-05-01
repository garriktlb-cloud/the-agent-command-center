## Listing Checklist Templates

Today the default checklist lives in code (`DEFAULT_CHECKLIST` in `ListingDetail.tsx`) and gets seeded the first time a listing is opened. We'll move it into the database and add a templates layer so agents can build their own reusable defaults — and admins can curate the platform-wide starting point.

### The model

Three tiers, each with a clear owner:

```text
┌─────────────────────────────────────────────────────────┐
│ PLATFORM DEFAULT                          (admin-owned) │
│ "List Bar Standard Checklist"                           │
│ One per system. Ships with sensible Denver defaults.    │
└──────────────────────┬──────────────────────────────────┘
                       │ clone as starting point
                       ▼
┌─────────────────────────────────────────────────────────┐
│ AGENT TEMPLATES                            (agent-owned)│
│ "My Standard Listing"     ★ default                     │
│ "Luxury Listing"                                        │
│ "Land Only"                                             │
└──────────────────────┬──────────────────────────────────┘
                       │ applied on listing create
                       ▼
┌─────────────────────────────────────────────────────────┐
│ LISTING CHECKLIST                  (per-listing, editable)│
│ Items copied in. Edits don't affect the template.       │
└─────────────────────────────────────────────────────────┘
```

When an agent creates a listing, the New Listing form gets a **"Apply template"** dropdown defaulted to their starred personal template (or the platform default if they haven't made one). On submit, items get copied into `listing_checklist_items` for that listing.

### Where templates live

**Settings → Checklist Templates** (new page, agent-accessible):
- List of the agent's templates with item counts and a star to mark their default
- "+ New template" — opens an editor; can start blank or "Clone from platform default" or clone any of their existing templates
- Editor UI is the same row layout as the listing checklist (sections, label, default assignee, default due-date offset like "+3 days from listing date") — but no done/completed state since templates are blueprints
- Delete, rename, duplicate

**Admin → Platform Checklist** (admin-only, shows up in the sidebar's Admin section only when the user has the `admin` role):
- Single editor for the platform default
- Same UI as agent template editor
- Bottom of page: a small note "X agents have this as their starting point" — purely informational

### Default due-date offsets

Instead of hardcoding dates, template items can have a `due_offset_days` (integer, can be negative) relative to either `listing_date` or `go_live_date`. When the template is applied, those resolve to actual dates on the listing's items. Examples:
- "Photography" → 3 days before go-live → resolves to `go_live_date - 3`
- "MLS input complete" → 1 day before go-live
- "Listing agreement signed" → on listing date

If an agent doesn't want offsets, they leave it blank and it's just an unscheduled item.

### Database changes

Two new tables:

**`checklist_templates`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | pk |
| user_id | uuid | NULL = platform template (admin-owned) |
| name | text | "My Standard Listing" |
| is_default | boolean | the agent's starred default; only one true per user |
| created_at / updated_at | timestamptz | |

**`checklist_template_items`**
| Column | Type | Notes |
|---|---|---|
| id | uuid | pk |
| template_id | uuid → templates.id | cascade delete |
| section | text | "Marketing", "Compliance", etc. |
| label | text | the task |
| sort_order | int | |
| assignee_type | text | self / listbar / vendor (default suggestion) |
| vendor_category | text | nullable; e.g. "Photographer" — at apply time, if the agent has exactly one vendor in that category, auto-link |
| due_offset_days | int | nullable; relative to anchor |
| due_offset_anchor | text | "listing_date" or "go_live_date" |

**RLS**:
- Templates with `user_id = NULL` (platform): readable by all authenticated, writable only by admins
- Templates with `user_id = auth.uid()`: full CRUD by owner

**Seeding**: a migration inserts one platform template using the current hardcoded `DEFAULT_CHECKLIST` content so nothing changes for existing/new users on day one.

**Apply logic**: a Postgres function `apply_template_to_listing(template_id, listing_id)` copies items into `listing_checklist_items`, resolving `due_offset_days` against the listing's dates.

### Files to change

- DB migration: two new tables, RLS, seed the platform default, `apply_template_to_listing` function
- `src/pages/ChecklistTemplates.tsx` (new) — agent template list + editor
- `src/pages/admin/PlatformChecklist.tsx` (new) — admin-only editor for the platform default
- `src/components/listings/ChecklistTemplateEditor.tsx` (new) — shared editor component used by both pages
- `src/components/forms/NewListingForm.tsx` — add "Apply template" dropdown
- `src/pages/ListingDetail.tsx` — remove the hardcoded `DEFAULT_CHECKLIST` seeding; if a listing has zero items (legacy), fall back to applying the agent's default template
- `src/components/layout/AppSidebar.tsx` — add "Checklist Templates" under Settings; conditionally show "Admin → Platform Checklist" for admins

### Open questions

1. **Per-listing override**: when applying a template, should we also let the agent tick "save changes back to my template" after editing the listing's checklist? Useful if they realize mid-listing that they always do X — but adds complexity. I'd skip this for v1.
2. **Sharing templates between agents in the same brokerage**: out of scope for now, or do you want a "share with team" toggle? (Brokerage/team isn't modeled yet, so probably v2.)
3. **Vendor category auto-link**: OK to auto-pick a vendor when the agent has exactly one in that category, otherwise leave the assignee chip showing "+ Assign"?
