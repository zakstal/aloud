CREATE OR REPLACE FUNCTION public.bump_audio_screenplay_version(
    screenplayId uuid
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_version_id uuid;
    latest_version_number int;
BEGIN
    -- Get the latest version number for the screenplay
    SELECT COALESCE(MAX(version_number), 0) INTO latest_version_number
    FROM public.audio_screenplay_versions
    WHERE screenplay_id = screenplayId;

    -- Bump the version number by 1
    latest_version_number := latest_version_number + 1;

    -- Insert a new version with the bumped version number
    INSERT INTO public.audio_screenplay_versions (
        id, screenplay_id, version_number, created_at
    )
    VALUES (
        gen_random_uuid(), screenplayId, latest_version_number, now()
    )
    RETURNING id INTO new_version_id;

    -- Return the new version id
    RETURN new_version_id;
END;
$$;
