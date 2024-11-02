CREATE OR REPLACE FUNCTION set_version_to_current(
    screenplayid UUID,
    versionnumber INT
)
RETURNS VOID AS $$
BEGIN
    -- Update lines with data from line_audit_log
    UPDATE public.lines lns
    SET 
        character_id = COALESCE(
            (al.new_data->>'character_id')::uuid, lns.character_id
        ),
        type = COALESCE(
            al.new_data->>'type', lns.type
        ),
        "isDialog" = COALESCE(
            (al.new_data->>'isDialog')::boolean, lns."isDialog"
        ),
        text = COALESCE(
            al.new_data->>'text', lns.text
        ),
        "order" = COALESCE(
            (al.new_data->>'order')::int, lns."order"
        ),
        deleted = COALESCE(
            (al.new_data->>'deleted')::boolean, lns.deleted
        )
    FROM public.line_audit_log al
    WHERE lns.id = (al.new_data->>'id')::uuid
    AND al.audio_screenplay_version_id = (
        SELECT id FROM public.audio_screenplay_versions
        WHERE screenplay_id = screenplayid
        AND version_number = versionnumber
        LIMIT 1
    );

    -- Update deleted column to true for all lines with created_version_number > versionnumber
    UPDATE public.lines
    SET deleted = true
    WHERE screenplay_id = screenplayid
    AND created_version_number > versionnumber;
END;
$$ LANGUAGE plpgsql;