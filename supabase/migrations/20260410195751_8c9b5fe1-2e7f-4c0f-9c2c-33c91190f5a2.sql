
ALTER TABLE public.listings
  ADD COLUMN bedrooms integer,
  ADD COLUMN bathrooms numeric,
  ADD COLUMN sqft integer,
  ADD COLUMN lot_size text,
  ADD COLUMN year_built integer,
  ADD COLUMN property_type text,
  ADD COLUMN garage_spaces integer,
  ADD COLUMN description text,
  ADD COLUMN features text[];
