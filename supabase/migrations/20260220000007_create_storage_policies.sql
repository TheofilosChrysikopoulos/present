-- Storage policies for product-images bucket
-- Assumes bucket 'product-images' already exists (created manually via dashboard)

-- Policy: Public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Policy: Admin can upload
CREATE POLICY "Admin can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Admin can update
CREATE POLICY "Admin can update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Policy: Admin can delete
CREATE POLICY "Admin can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);
