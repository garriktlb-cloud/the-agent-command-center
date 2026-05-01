# Colorado transaction templates + contract parsing

## What we're building

A transaction equivalent of the listing checklist system, tuned to the Colorado Residential Contract. Three pieces:

1. A **platform "Colorado Residential Contract" template** — the standard contract deadlines, all anchored to MEC (Mutual Execution / contract acceptance date).
2. A **personal "Transaction add-ons" template** per agent — their own items like closing gifts, lender follow-ups.
3. A **contract upload + AI extraction** flow that pulls MEC, closing date, earnest money, parties, and price out of a PDF and auto-applies the platform template.

Manual entry path stays available — same auto-calc kicks in either way.

## User flow

**Creating a transaction:**
```
New Transaction
 ├─ Option A: Upload Contract PDF  → AI extracts dates → review → confirm
 └─ Option B: Enter Manually        → fields for MEC, closing, EM, parties
                  ↓
         Platform CO template applied (15 deadlines auto-dated from MEC)
                  ↓
         Agent's "add-ons" template applied (their custom items)
                  ↓
         Transaction detail page with full checklist
```

**Editing MEC later (contract amended):**
Dialog appears: "MEC changed from X to Y. How should deadlines be updated?"
- Recalc all items
- Recalc only incomplete items
- Skip — leave dates alone

## Schema changes

**`transactions` table** — add:
- `mec_date date` — Mutual Execution Date, the anchor for all deadlines
- `contract_file_path text` — path to uploaded PDF in storage

**`checklist_templates` table** — add:
- `template_type text default 'listing'` — `'listing'` or `'transaction'`

Existing listing templates stay as `'listing'`. New transaction templates use `'transaction'`. Same table, same editor UI, just filtered by type.

**`checklist_template_items`** — already has `due_offset_days` and `due_offset_anchor`. Extend the anchor enum-ish values to include `'mec_date'` and `'closing_date'` (currently it accepts `'listing_date'` and `'go_live_date'`).

**New storage bucket**: `contracts` (private) — for uploaded PDFs. RLS: agents can only read/write their own folder.

**New SQL function**: `apply_transaction_template(_template_id, _transaction_id)` — mirrors the existing `apply_template_to_listing`, but anchors offsets to `mec_date` (or `closing_date` for back-dated items like "send closing gift +7 days").

## Platform Colorado template (seeded)

Standard items, all offsets from MEC unless noted:

| Section | Item | Offset |
|---|---|---|
| Earnest Money | Earnest money delivered | +3 days |
| Title | Title documents deadline | +3 days |
| Title | Title objection deadline | +10 days |
| Survey | Survey deadline | +20 days |
| Inspection | Inspection objection deadline | +14 days |
| Inspection | Inspection resolution deadline | +17 days |
| Loan | Loan application deadline | +3 days |
| Loan | Loan terms deadline | +25 days |
| Loan | Loan availability deadline | -3 days from closing |
| Appraisal | Appraisal deadline | -10 days from closing |
| Appraisal | Appraisal objection deadline | -7 days from closing |
| Insurance | Property insurance deadline | -5 days from closing |
| Closing | Closing documents | -1 day from closing |
| Closing | Closing date | from contract |
| Closing | Possession | from contract |

(Exact day counts can be tuned by admin in `/admin/platform-checklist` — the new tab will have a "Transaction (CO)" template alongside the listing one.)

## Contract parsing edge function

**New edge function**: `parse-contract`
- Accepts: PDF file (uploaded to `contracts` bucket first, function gets the path)
- Calls Lovable AI Gateway with `google/gemini-2.5-flash`
- Sends PDF as base64 image attachment
- Uses tool-calling for structured extraction:
  ```
  {
    mec_date, closing_date, possession_date,
    contract_price, earnest_money_amount, earnest_money_due,
    buyer_names[], seller_names[],
    property_address
  }
  ```
- Returns JSON; client shows a review screen before saving so agent can correct any field.

Handles 429 (rate limited) and 402 (out of credits) with friendly toasts.

## UI changes

**`/settings/checklist-templates`** — add tabs at the top:
- **Listings** (existing view)
- **Transaction add-ons** (new — same editor, filtered to `template_type = 'transaction'`)

**`/admin/platform-checklist`** — add tabs:
- **Listings** (existing)
- **Transaction (CO)** (new — edits the platform CO template)

**`/transactions/new`** — replace simple form with:
- Top: "Upload contract" dropzone + "Or enter manually" toggle
- Manual fields: MEC date, closing date, EM amount/due, buyer/seller names, address (linked to listing)
- After submit: applies platform CO template + agent's add-on template

**`/transactions/:id`** — checklist section gets the same UI as the listing checklist (sections, assignees, due dates, done toggle).

**MEC change dialog** — when MEC date is edited on an existing transaction, modal asks how to handle deadlines (recalc all / recalc incomplete / skip).

## Files to create/edit

**New:**
- `supabase/migrations/<ts>_transaction_templates.sql` — schema changes + seed CO template
- `supabase/functions/parse-contract/index.ts` — AI extraction edge function
- `src/components/transactions/ContractUpload.tsx` — dropzone + AI review screen
- `src/components/transactions/NewTransactionForm.tsx` — manual + upload paths
- `src/components/transactions/MecChangeDialog.tsx` — recalc options
- `src/components/transactions/TransactionChecklist.tsx` — checklist UI on detail page
- `src/pages/admin/PlatformChecklist.tsx` — extended with tabs (or split into two pages)

**Edit:**
- `src/pages/ChecklistTemplates.tsx` — add Listings / Transaction add-ons tabs
- `src/pages/admin/PlatformChecklist.tsx` — add Listings / Transaction (CO) tabs
- `src/pages/TransactionDetail.tsx` — render checklist + handle MEC edits
- `src/pages/Transactions.tsx` — link to new transaction form
- `src/components/listings/ChecklistTemplateEditor.tsx` — add `'mec_date'` and `'closing_date'` to anchor options when editing transaction templates

## Out of scope (for now)

- Non-Colorado contracts — single state only.
- Auto-detecting contract amendments from re-uploaded PDFs.
- Pushing checklist deadlines to a calendar feed.
- AI parsing of addenda (CR-, ETC-, etc.) — only the main contract for v1.

## Open question for after approval

The listing has its own listing-level checklist already. When a listing converts to a transaction (offer accepted), do you want the listing's incomplete items to migrate into the transaction, stay on the listing, or get archived? Worth deciding before build.
