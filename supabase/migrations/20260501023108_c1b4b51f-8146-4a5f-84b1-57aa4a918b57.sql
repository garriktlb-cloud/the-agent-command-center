CREATE OR REPLACE FUNCTION public.apply_transaction_template(_template_id uuid, _transaction_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND NOT EXISTS (
      SELECT 1 FROM public.transaction_checklist_items existing
      WHERE existing.transaction_id = _transaction_id
        AND existing.section = i.section
        AND existing.label = i.label
    )
  ORDER BY i.sort_order;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$function$;