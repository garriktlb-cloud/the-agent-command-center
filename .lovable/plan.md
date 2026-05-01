# Apply template manually to transactions

Switch from silently auto-applying templates at transaction creation to letting the agent click a button to add the templates they want.

## What changes for the agent

**Today:** Creating a transaction silently injects the platform Colorado Contract template + your default add-on template. Items can land with no due dates if MEC isn't set, and re-running anything would duplicate items.

**After:** New transactions start clean. On the transaction detail page, the agent sees:

- **Empty checklist state** — two clear buttons:
  - `+ Apply Colorado Contract` (the platform statutory deadlines)
  - `+ Apply my default add-ons: "<name>"` (only shown if they have a starred default)
  - `Browse all templates ▾` (dropdown with everything available)

- **Once items exist** — a small `+ Apply template ▾` button at the top of the checklist with a dropdown grouped into:
  - **Platform** → Colorado Residential Contract
  - **My add-ons** → all their transaction add-on templates (default starred)

Each click runs the existing `apply_transaction_template` RPC and toasts how many items were added. If MEC date isn't set yet, a follow-up toast warns "Set the MEC date to auto-calculate deadlines."

## Safety: prevent double-apply

Update the `apply_transaction_template` SQL function so it skips items where the same `section + label` already exists on that transaction. This way clicking "Apply" twice does nothing the second time instead of duplicating 15 deadlines. Toast becomes "No new items added — template already applied" when count is 0.

## Files

**New:** `src/components/transactions/ApplyTemplateButton.tsx`
- Reusable dropdown button. Loads platform + user's transaction templates on open.
- Calls `apply_transaction_template` RPC, invalidates the `txn-checklist` query.
- Props: `transactionId`, `hasMecDate`, `variant`, `size`, `label`.

**Edit:** `src/pages/TransactionDetail.tsx`
- Replace the existing "Initialize Default Checklist" empty state with the two-button layout described above.
- Add `<ApplyTemplateButton>` next to the existing "Quick add" button in the checklist header.
- Remove the now-unused `seedChecklist` mutation and `defaultChecklist` blueprint constant.

**Edit:** `src/components/transactions/NewTransactionDialog.tsx`
- Remove the two `apply_transaction_template` RPC calls in the `create` mutation.
- Remove the `coTemplateId` and `addOnTemplateId` queries (no longer needed).
- Update success toast from "Transaction created with full Colorado checklist" to "Transaction created."

**DB migration:** Update `apply_transaction_template` to add a `NOT EXISTS` guard against `(transaction_id, section, label)` duplicates. Same signature, same return value.

## Out of scope

- Tracking which templates have been applied historically (no new table).
- Listing-side templates — this is transaction-only since that's where the duplicate-risk and MEC-date issue lives.
