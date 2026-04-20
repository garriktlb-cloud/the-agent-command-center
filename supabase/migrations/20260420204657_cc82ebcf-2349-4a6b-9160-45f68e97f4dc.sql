
-- Create marketing_insights table
CREATE TABLE public.marketing_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  hook_text text NOT NULL,
  insight_body text NOT NULL DEFAULT '',
  talk_track text NOT NULL DEFAULT '',
  social_caption text NOT NULL DEFAULT '',
  image_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_insights ENABLE ROW LEVEL SECURITY;

-- Read-only for authenticated users
CREATE POLICY "Authenticated can view insights"
  ON public.marketing_insights
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage
CREATE POLICY "Admins manage insights"
  ON public.marketing_insights
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_marketing_insights_updated_at
  BEFORE UPDATE ON public.marketing_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-images', 'marketing-images', true);

-- Public read for marketing images
CREATE POLICY "Marketing images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'marketing-images');
