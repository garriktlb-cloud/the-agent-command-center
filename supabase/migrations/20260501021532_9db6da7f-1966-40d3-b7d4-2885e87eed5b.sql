DROP INDEX IF EXISTS public.idx_checklist_templates_one_default_per_user;
CREATE UNIQUE INDEX idx_checklist_templates_one_default_per_user_type
  ON public.checklist_templates (user_id, template_type)
  WHERE is_default = true AND user_id IS NOT NULL;