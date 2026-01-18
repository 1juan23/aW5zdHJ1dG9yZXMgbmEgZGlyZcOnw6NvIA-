-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for avatars bucket
-- Allow anyone to view avatars
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- RLS for review-photos bucket
CREATE POLICY "Public Access Reviews" ON storage.objects FOR SELECT USING (bucket_id = 'review-photos');

CREATE POLICY "Users can upload review photos" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'review-photos' AND 
  auth.role() = 'authenticated'
);
