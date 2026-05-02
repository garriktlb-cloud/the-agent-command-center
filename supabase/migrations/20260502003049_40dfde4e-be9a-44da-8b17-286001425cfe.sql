ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS source_transcript text,
  ADD COLUMN IF NOT EXISTS source_confidence numeric,
  ADD COLUMN IF NOT EXISTS service_details jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_orders_service_type ON public.orders(service_type);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);