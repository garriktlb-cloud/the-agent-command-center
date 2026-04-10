
CREATE TABLE public.transaction_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  section TEXT NOT NULL DEFAULT 'Custom',
  done BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  handled_by TEXT, -- 'self' or 'listbar'
  service_type TEXT, -- 'inspection', 'walkthrough', etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transaction_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own checklist" ON public.transaction_checklist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "TC/Admin see all checklist" ON public.transaction_checklist_items FOR SELECT USING (has_role(auth.uid(), 'tc'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users create own checklist" ON public.transaction_checklist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checklist" ON public.transaction_checklist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own checklist" ON public.transaction_checklist_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_transaction_checklist_items_updated_at
  BEFORE UPDATE ON public.transaction_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
