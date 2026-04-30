-- Add assignee + due date columns to listing checklist
ALTER TABLE public.listing_checklist_items
  ADD COLUMN IF NOT EXISTS assignee_type text CHECK (assignee_type IN ('self','listbar','vendor')),
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_listing_checklist_items_due_date
  ON public.listing_checklist_items(due_date) WHERE due_date IS NOT NULL;

-- Same for transaction checklist
ALTER TABLE public.transaction_checklist_items
  ADD COLUMN IF NOT EXISTS assignee_type text CHECK (assignee_type IN ('self','listbar','vendor')),
  ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_transaction_checklist_items_due_date
  ON public.transaction_checklist_items(due_date) WHERE due_date IS NOT NULL;