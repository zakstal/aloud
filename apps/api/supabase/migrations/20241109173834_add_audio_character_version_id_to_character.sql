-- Migration to add audio_character_version_id foreign key to characters table

-- Step 1: Add the audio_character_version_id column to the characters table
ALTER TABLE public.characters
ADD COLUMN audio_character_version_id uuid;

-- Step 2: Add the foreign key constraint for audio_character_version_id
ALTER TABLE public.characters
ADD CONSTRAINT fk_audio_character_version FOREIGN KEY (audio_character_version_id) 
REFERENCES public.audio_character_version(id) ON DELETE CASCADE;

-- Step 3: Create an index for the new column to optimize queries
CREATE INDEX idx_characters_audio_character_version_id ON public.characters(audio_character_version_id);
