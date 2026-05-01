
-- 1. transactions table additions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS mec_date date,
  ADD COLUMN IF NOT EXISTS contract_file_path text;

-- 2. template_type on checklist_templates
ALTER TABLE public.checklist_templates
  ADD COLUMN IF NOT EXISTS template_type text NOT NULL DEFAULT 'listing';

-- 3. contracts storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own folder (contracts/<user_id>/...)
CREATE POLICY "Users read own contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own contracts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own contracts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. apply_transaction_template function
CREATE OR REPLACE FUNCTION public.apply_transaction_template(_template_id uuid, _transaction_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _mec_date DATE;
  _closing_date DATE;
  _count INTEGER;
BEGIN
  SELECT user_id, mec_date, closing_date
    INTO _user_id, _mec_date, _closing_date
  FROM public.transactions WHERE id = _transaction_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF auth.uid() <> _user_id
     AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND NOT has_role(auth.uid(), 'tc'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.checklist_templates t
    WHERE t.id = _template_id
      AND (t.user_id IS NULL OR t.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Template not accessible';
  END IF;

  INSERT INTO public.transaction_checklist_items
    (transaction_id, user_id, section, label, sort_order, assignee_type, due_date)
  SELECT
    _transaction_id,
    _user_id,
    i.section,
    i.label,
    i.sort_order,
    i.assignee_type,
    CASE
      WHEN i.due_offset_days IS NULL THEN NULL
      WHEN i.due_offset_anchor = 'mec_date' AND _mec_date IS NOT NULL
        THEN _mec_date + i.due_offset_days
      WHEN i.due_offset_anchor = 'closing_date' AND _closing_date IS NOT NULL
        THEN _closing_date + i.due_offset_days
      ELSE NULL
    END
  FROM public.checklist_template_items i
  WHERE i.template_id = _template_id
  ORDER BY i.sort_order;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- 5. Recalculate dates on a transaction (used when MEC changes)
CREATE OR REPLACE FUNCTION public.recalc_transaction_deadlines(
  _transaction_id uuid,
  _only_incomplete boolean DEFAULT true
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _mec_date DATE;
  _closing_date DATE;
  _count INTEGER := 0;
BEGIN
  SELECT user_id, mec_date, closing_date
    INTO _user_id, _mec_date, _closing_date
  FROM public.transactions WHERE id = _transaction_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF auth.uid() <> _user_id
     AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND NOT has_role(auth.uid(), 'tc'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- We re-derive due dates by matching items back to template items by label.
  -- Find every transaction_checklist_item whose label matches a template item
  -- in any template the user can access (platform OR own).
  WITH source_items AS (
    SELECT DISTINCT ON (i.label, i.section)
      i.label, i.section, i.due_offset_days, i.due_offset_anchor
    FROM public.checklist_template_items i
    JOIN public.checklist_templates t ON t.id = i.template_id
    WHERE (t.user_id IS NULL OR t.user_id = _user_id)
      AND t.template_type = 'transaction'
  )
  UPDATE public.transaction_checklist_items tci
  SET due_date = CASE
    WHEN si.due_offset_days IS NULL THEN tci.due_date
    WHEN si.due_offset_anchor = 'mec_date' AND _mec_date IS NOT NULL
      THEN _mec_date + si.due_offset_days
    WHEN si.due_offset_anchor = 'closing_date' AND _closing_date IS NOT NULL
      THEN _closing_date + si.due_offset_days
    ELSE tci.due_date
  END,
  updated_at = now()
  FROM source_items si
  WHERE tci.transaction_id = _transaction_id
    AND tci.label = si.label
    AND tci.section = si.section
    AND (NOT _only_incomplete OR tci.done = false);

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- 6. Seed the platform Colorado Residential Contract template
DO $$
DECLARE
  _tpl_id uuid;
BEGIN
  SELECT id INTO _tpl_id
  FROM public.checklist_templates
  WHERE user_id IS NULL AND template_type = 'transaction' AND name = 'Colorado Residential Contract'
  LIMIT 1;

  IF _tpl_id IS NULL THEN
    INSERT INTO public.checklist_templates (user_id, name, template_type, is_default)
    VALUES (NULL, 'Colorado Residential Contract', 'transaction', true)
    RETURNING id INTO _tpl_id;

    INSERT INTO public.checklist_template_items
      (template_id, section, label, sort_order, due_offset_days, due_offset_anchor, assignee_type)
    VALUES
      (_tpl_id, 'Earnest Money', 'Earnest money delivered',          10,  3, 'mec_date',     'self'),
      (_tpl_id, 'Title',         'Title documents deadline',         20,  3, 'mec_date',     'listbar'),
      (_tpl_id, 'Title',         'Title objection deadline',         21, 10, 'mec_date',     'self'),
      (_tpl_id, 'Survey',        'Survey deadline',                  30, 20, 'mec_date',     'vendor'),
      (_tpl_id, 'Inspection',    'Inspection objection deadline',    40, 14, 'mec_date',     'self'),
      (_tpl_id, 'Inspection',    'Inspection resolution deadline',   41, 17, 'mec_date',     'self'),
      (_tpl_id, 'Loan',          'Loan application deadline',        50,  3, 'mec_date',     'self'),
      (_tpl_id, 'Loan',          'Loan terms deadline',              51, 25, 'mec_date',     'vendor'),
      (_tpl_id, 'Loan',          'Loan availability deadline',       52, -3, 'closing_date', 'vendor'),
      (_tpl_id, 'Appraisal',     'Appraisal deadline',               60,-10, 'closing_date', 'vendor'),
      (_tpl_id, 'Appraisal',     'Appraisal objection deadline',     61, -7, 'closing_date', 'self'),
      (_tpl_id, 'Insurance',     'Property insurance deadline',      70, -5, 'closing_date', 'self'),
      (_tpl_id, 'Closing',       'Closing documents review',         80, -1, 'closing_date', 'listbar'),
      (_tpl_id, 'Closing',       'Closing date',                     81,  0, 'closing_date', 'self'),
      (_tpl_id, 'Closing',       'Possession',                       82,  0, 'closing_date', 'self');
  END IF;
END $$;
