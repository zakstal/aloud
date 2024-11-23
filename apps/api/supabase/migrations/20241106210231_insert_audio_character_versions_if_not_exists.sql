CREATE OR REPLACE FUNCTION public.insert_audio_character_versions_if_not_exists(
    versions JSONB
) RETURNS TABLE (audio_character_version_id UUID) AS $$
DECLARE
    item JSONB;
    new_audio_character_version_id UUID;
BEGIN
    -- Loop through each item in the JSONB array
    FOR item IN SELECT * FROM jsonb_array_elements(versions)
    LOOP
        -- Only insert if no matching record exists
        IF NOT EXISTS (
            SELECT 1
            FROM public.audio_character_version
            WHERE audio_screenplay_version_id = (item->>'audio_screenplay_version_id')::UUID
              AND character_id = (item->>'character_id')::UUID
        ) THEN
            -- Insert the new audio_character_version and store the ID
            INSERT INTO public.audio_character_version (
                id, 
                audio_screenplay_version_id, 
                character_id, 
                voice_data, 
                voice_id, 
                voice_name, 
                version_number, 
                created_at
            )
            VALUES (
                gen_random_uuid(), 
                (item->>'audio_screenplay_version_id')::UUID,
                (item->>'character_id')::UUID,
                item->'voice_data',
                item->>'voice_id',
                item->>'voice_name',
                COALESCE((item->>'version_number')::INT, 1), 
                now()
            )
            RETURNING id INTO new_audio_character_version_id;

            -- Update the character's audio_character_version_id with the new ID
            UPDATE public.characters
            SET audio_character_version_id = new_audio_character_version_id
            WHERE id = (item->>'character_id')::UUID;

            -- Return the new audio_character_version_id
            RETURN QUERY SELECT new_audio_character_version_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
