-- Step 1: Create the function to create a new audio_version if ready
CREATE OR REPLACE FUNCTION public.create_audio_version_if_ready(
    line_id UUID,
    audio_screenplay_version_id UUID
) RETURNS UUID AS $$
DECLARE
    new_line_id UUID := line_id;
    new_audio_screenplay_version_id UUID := audio_screenplay_version_id;
    character_id UUID;
    audio_character_version_id UUID;
    version_number INT;
    new_audio_version_id UUID;
    is_dialog BOOLEAN;
BEGIN
    -- Check if the line is marked as dialog
    SELECT "isDialog" INTO is_dialog
    FROM public.lines
    WHERE id = new_line_id;

    -- If the line is not dialog, exit the function
    IF is_dialog IS DISTINCT FROM TRUE THEN
        RAISE NOTICE 'Line is not marked as dialog. Skipping audio version creation.';
        RETURN NULL;
    END IF;

    -- Check if all existing audio_versions for this line_id have an audio_file_url
    IF EXISTS (
        SELECT 1
        FROM public.audio_version av
        WHERE av.line_id = new_line_id
          AND audio_file_url IS NULL
    ) THEN
        RAISE NOTICE 'Cannot create new audio_version as some audio_versions for this line are missing audio_file_url.';
        RETURN NULL;
    END IF;

    -- Retrieve the character_id from the line
    SELECT pl.character_id INTO character_id
    FROM public.lines pl
    WHERE id = new_line_id;

    -- Get the audio_character_version_id from the character_id
    SELECT cc.audio_character_version_id INTO audio_character_version_id
    FROM public.characters cc
    WHERE id = character_id;

    -- Get the version_number from the audio_screenplay_version_id
    SELECT asv.version_number INTO version_number
    FROM public.audio_screenplay_versions asv
    WHERE id = new_audio_screenplay_version_id;

    -- Insert a new audio_version
    INSERT INTO public.audio_version (
        id, 
        line_id, 
        screenplay_id, 
        audio_character_version_id,
        audio_screenplay_version_id,
        version_number, 
        created_at
    )
    VALUES (
        gen_random_uuid(),
        new_line_id,
        (SELECT screenplay_id FROM public.lines WHERE id = new_line_id),
        audio_character_version_id,
        new_audio_screenplay_version_id,
        version_number,
        now()
    )
    RETURNING id INTO new_audio_version_id;

    RETURN new_audio_version_id;
END;
$$ LANGUAGE plpgsql;
