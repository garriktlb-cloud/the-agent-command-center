
DROP POLICY IF EXISTS "Public read coaching media" ON storage.objects;

-- Allow direct file reads (public URLs work) but prevent broad listing by anon
CREATE POLICY "Authenticated read coaching media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'coaching-media');

CREATE POLICY "Anon read coaching media files"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'coaching-media' AND name IS NOT NULL);
