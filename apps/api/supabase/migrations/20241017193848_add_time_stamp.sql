ALTER TABLE public.audio_screenplay_versions
ADD COLUMN updated_at timestamptz default now();