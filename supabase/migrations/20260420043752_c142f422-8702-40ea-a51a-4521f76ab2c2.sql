
-- Coaching topics
CREATE TABLE public.coaching_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_path TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coaching_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view topics"
  ON public.coaching_topics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage topics"
  ON public.coaching_topics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coaching_topics_updated_at
  BEFORE UPDATE ON public.coaching_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coaching episodes
CREATE TABLE public.coaching_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.coaching_topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  media_type TEXT NOT NULL CHECK (media_type IN ('audio', 'video')),
  media_path TEXT,
  episode_number INTEGER NOT NULL DEFAULT 1,
  key_takeaway TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coaching_episodes_topic ON public.coaching_episodes(topic_id);

ALTER TABLE public.coaching_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view episodes"
  ON public.coaching_episodes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage episodes"
  ON public.coaching_episodes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_coaching_episodes_updated_at
  BEFORE UPDATE ON public.coaching_episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Coaching progress
CREATE TABLE public.coaching_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  episode_id UUID NOT NULL REFERENCES public.coaching_episodes(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, episode_id)
);

CREATE INDEX idx_coaching_progress_user ON public.coaching_progress(user_id);

ALTER TABLE public.coaching_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own progress"
  ON public.coaching_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress"
  ON public.coaching_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON public.coaching_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own progress"
  ON public.coaching_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_coaching_progress_updated_at
  BEFORE UPDATE ON public.coaching_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('coaching-media', 'coaching-media', true);

CREATE POLICY "Public read coaching media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'coaching-media');

CREATE POLICY "Admins upload coaching media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'coaching-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update coaching media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'coaching-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete coaching media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'coaching-media' AND public.has_role(auth.uid(), 'admin'));
