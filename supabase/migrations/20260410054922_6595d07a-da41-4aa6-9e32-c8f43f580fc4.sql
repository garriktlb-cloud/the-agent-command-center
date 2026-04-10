
-- Custom checklist items for listings
CREATE TABLE public.listing_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  section TEXT NOT NULL DEFAULT 'Custom',
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own checklist items" ON public.listing_checklist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "TC/Admin see all checklist items" ON public.listing_checklist_items FOR SELECT USING (has_role(auth.uid(), 'tc'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users create own checklist items" ON public.listing_checklist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own checklist items" ON public.listing_checklist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own checklist items" ON public.listing_checklist_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_listing_checklist_items_updated_at BEFORE UPDATE ON public.listing_checklist_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Open houses for listings
CREATE TABLE public.open_houses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.open_houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents see own open houses" ON public.open_houses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "TC/Admin see all open houses" ON public.open_houses FOR SELECT USING (has_role(auth.uid(), 'tc'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users create own open houses" ON public.open_houses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own open houses" ON public.open_houses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own open houses" ON public.open_houses FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_open_houses_updated_at BEFORE UPDATE ON public.open_houses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
