
-- Add seller_name and assigned_to columns to listings
ALTER TABLE public.listings ADD COLUMN seller_name text;
ALTER TABLE public.listings ADD COLUMN assigned_to uuid;

-- Add photography_scheduled to listing_status enum
ALTER TYPE public.listing_status ADD VALUE IF NOT EXISTS 'photography_scheduled';
