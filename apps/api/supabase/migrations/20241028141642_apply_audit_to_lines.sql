CREATE OR REPLACE FUNCTION public.get_screenplay_by_version(
    screenplayid uuid,
    versionnumber int
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    lines jsonb;
    line_changes RECORD;
    final_lines jsonb := '[]'::jsonb;
BEGIN
    -- Get all the lines that are valid for the version number, applying audit log changes
    FOR line_changes IN
        SELECT la.line_id, la.action, la.new_data, la.old_data
        FROM public.line_audit_log la
        JOIN public.audio_screenplay_versions asv ON asv.id = la.audio_screenplay_version_id
        WHERE la.screenplay_id = screenplayid
        AND asv.version_number <= versionnumber
        ORDER BY la.created_at
    LOOP
        -- Apply changes to the line state based on action
        IF line_changes.action = 'insert' THEN
            -- Add new line
            final_lines := final_lines || jsonb_build_object(
                'id', line_changes.new_data->>'id',
                'order', line_changes.new_data->>'order',
                'type', line_changes.new_data->>'type',
                'text', line_changes.new_data->>'text',
                'isDialog', line_changes.new_data->>'isDialog',
                'character_id', line_changes.new_data->>'character_id',
                'deleted', line_changes.new_data->>'deleted'
            );
        ELSIF line_changes.action = 'update' THEN
            -- Update the existing line by replacing its properties
            final_lines := jsonb_agg(jsonb_strip_nulls(
                jsonb_set(final_lines, '{id}', line_changes.new_data)
            ));
        ELSIF line_changes.action = 'delete' THEN
            -- Remove the line if it was deleted
            final_lines := final_lines - line_changes.old_data->>'id';
        END IF;
    END LOOP;

    -- Return final lines
    RETURN final_lines;
END;
$$;
