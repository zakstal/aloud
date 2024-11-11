
-- Step 2: Create the trigger function to call create_audio_version_if_ready with the latest audio_screenplay_version_id
CREATE OR REPLACE FUNCTION public.trigger_create_audio_version_if_ready()
RETURNS TRIGGER AS $$
DECLARE
    latest_audio_screenplay_version_id UUID;
BEGIN
    -- Retrieve the latest audio_screenplay_version_id for the line's screenplay
    SELECT id INTO latest_audio_screenplay_version_id
    FROM public.audio_screenplay_versions
    WHERE screenplay_id = NEW.screenplay_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Call create_audio_version_if_ready function with the new or updated line ID
    PERFORM public.create_audio_version_if_ready(
        NEW.id, 
        latest_audio_screenplay_version_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger on the lines table
CREATE TRIGGER trigger_create_audio_version_if_ready
AFTER INSERT OR UPDATE ON public.lines
FOR EACH ROW
EXECUTE FUNCTION public.trigger_create_audio_version_if_ready();
