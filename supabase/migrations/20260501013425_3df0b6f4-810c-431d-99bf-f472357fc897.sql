-- Templates
CREATE TABLE public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- NULL = platform template (admin-managed)
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_templates_user ON public.checklist_templates(user_id);

-- Only one default per user
CREATE UNIQUE INDEX idx_checklist_templates_one_default_per_user
  ON public.checklist_templates(user_id) WHERE is_default = true AND user_id IS NOT NULL;

-- Template items
CREATE TABLE public.checklist_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  section TEXT NOT NULL DEFAULT 'Custom',
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  assignee_type TEXT, -- self | listbar | vendor
  vendor_category TEXT,
  due_offset_days INTEGER,
  due_offset_anchor TEXT, -- listing_date | go_live_date
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_template_items_template ON public.checklist_template_items(template_id);

-- RLS
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;

-- Templates: read
CREATE POLICY "Anyone authed can view platform templates"
  ON public.checklist_templates FOR SELECT
  TO authenticated
  USING (user_id IS NULL);

CREATE POLICY "Users view own templates"
  ON public.checklist_templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "TC/Admin view all templates"
  ON public.checklist_templates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'tc'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Templates: write (agent owns own, admin owns platform)
CREATE POLICY "Users insert own templates"
  ON public.checklist_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own templates"
  ON public.checklist_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own templates"
  ON public.checklist_templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage platform templates"
  ON public.checklist_templates FOR ALL
  TO authenticated
  USING (user_id IS NULL AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id IS NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Template items: inherit visibility from parent template
CREATE POLICY "View template items if can view template"
  ON public.checklist_template_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.checklist_templates t
    WHERE t.id = template_id
      AND (t.user_id IS NULL OR t.user_id = auth.uid()
           OR has_role(auth.uid(), 'tc'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  ));

CREATE POLICY "Manage template items if own template"
  ON public.checklist_template_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.checklist_templates t
    WHERE t.id = template_id AND t.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.checklist_templates t
    WHERE t.id = template_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "Admins manage platform template items"
  ON public.checklist_template_items FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.checklist_templates t
    WHERE t.id = template_id AND t.user_id IS NULL AND has_role(auth.uid(), 'admin'::app_role)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.checklist_templates t
    WHERE t.id = template_id AND t.user_id IS NULL AND has_role(auth.uid(), 'admin'::app_role)
  ));

-- updated_at triggers
CREATE TRIGGER trg_checklist_templates_updated
  BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_checklist_template_items_updated
  BEFORE UPDATE ON public.checklist_template_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the platform default
INSERT INTO public.checklist_templates (id, user_id, name, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', NULL, 'List Bar Standard Checklist', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.checklist_template_items (template_id, section, label, sort_order, assignee_type) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Pre-Launch', 'Listing agreement signed', 0, 'self'),
  ('00000000-0000-0000-0000-000000000001', 'Pre-Launch', 'Seller disclosures collected', 1, 'self'),
  ('00000000-0000-0000-0000-000000000001', 'Pre-Launch', 'Pricing strategy confirmed with agent', 2, 'self'),
  ('00000000-0000-0000-0000-000000000001', 'Pre-Launch', 'Showing instructions confirmed', 3, 'listbar'),
  ('00000000-0000-0000-0000-000000000001', 'Marketing', 'Photography scheduled and completed', 4, 'vendor'),
  ('00000000-0000-0000-0000-000000000001', 'Marketing', 'MLS input complete', 5, 'listbar'),
  ('00000000-0000-0000-0000-000000000001', 'Marketing', 'Signage installation confirmed', 6, 'vendor'),
  ('00000000-0000-0000-0000-000000000001', 'Go Live', 'Activate listing on MLS', 7, 'listbar'),
  ('00000000-0000-0000-0000-000000000001', 'Go Live', 'Confirm go-live with agent', 8, 'self');

-- Apply function: copies template items into listing_checklist_items
CREATE OR REPLACE FUNCTION public.apply_template_to_listing(_template_id UUID, _listing_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _listing_date DATE;
  _count INTEGER;
BEGIN
  -- Verify caller owns listing or is admin/tc
  SELECT user_id, listing_date INTO _user_id, _listing_date
  FROM public.listings WHERE id = _listing_id;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF auth.uid() <> _user_id
     AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND NOT has_role(auth.uid(), 'tc'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Verify caller can use template (own it OR it's platform)
  IF NOT EXISTS (
    SELECT 1 FROM public.checklist_templates t
    WHERE t.id = _template_id
      AND (t.user_id IS NULL OR t.user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Template not accessible';
  END IF;

  INSERT INTO public.listing_checklist_items
    (listing_id, user_id, section, label, sort_order, assignee_type, due_date)
  SELECT
    _listing_id,
    _user_id,
    i.section,
    i.label,
    i.sort_order,
    i.assignee_type,
    CASE
      WHEN i.due_offset_days IS NULL THEN NULL
      WHEN i.due_offset_anchor = 'listing_date' AND _listing_date IS NOT NULL
        THEN _listing_date + i.due_offset_days
      ELSE NULL
    END
  FROM public.checklist_template_items i
  WHERE i.template_id = _template_id
  ORDER BY i.sort_order;

  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;