-- this is not used at all
CREATE OR REPLACE FUNCTION public.get_screenplay_by_version(
    screenplayid uuid,
    versionnumber int
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    line_changes RECORD;
    final_lines jsonb := '[]'::jsonb;
    audio_version_data jsonb;
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
        -- Get audio_version data for the line
        SELECT jsonb_agg(jsonb_build_object(
            'id', av.id,
            'audio_file_url', av.audio_file_url,
            'duration_in_seconds', av.duration_in_seconds,
            'version_number', av.version_number
        )) INTO audio_version_data
        FROM public.audio_version av
        WHERE av.line_id = (line_changes.new_data->>'id')::uuid; -- Cast text to uuid

        IF line_changes.action = 'insert' THEN
            -- Add new line with audio_version data
            final_lines := final_lines || jsonb_build_object(
                'id', line_changes.new_data->>'id',
                'order', line_changes.new_data->>'order',
                'type', line_changes.new_data->>'type',
                'text', line_changes.new_data->>'text',
                'isDialog', line_changes.new_data->>'isDialog',
                'character_id', line_changes.new_data->>'character_id',
                'deleted', line_changes.new_data->>'deleted',
                'audio_version', COALESCE(audio_version_data, '[]'::jsonb) -- Attach audio_version data
            );
        ELSIF line_changes.action = 'update' THEN
            -- Loop through existing lines to find the one to update
            final_lines := (
                SELECT jsonb_agg(
                    CASE 
                        WHEN elem->>'id' = line_changes.old_data->>'id' THEN
                            jsonb_set(elem, '{text}', to_jsonb(line_changes.new_data->>'text'))
                            || jsonb_set(elem, '{order}', to_jsonb(line_changes.new_data->>'order'))
                            || jsonb_set(elem, '{type}', to_jsonb(line_changes.new_data->>'type'))
                            || jsonb_set(elem, '{isDialog}', to_jsonb(line_changes.new_data->>'isDialog'))
                            || jsonb_set(elem, '{character_id}', to_jsonb(line_changes.new_data->>'character_id'))
                            || jsonb_set(elem, '{deleted}', to_jsonb(line_changes.new_data->>'deleted'))
                            || jsonb_set(elem, '{audio_version}', COALESCE(audio_version_data, '[]'::jsonb))
                        ELSE elem
                    END
                )
                FROM jsonb_array_elements(final_lines) AS elem
            );
        ELSIF line_changes.action = 'delete' THEN
            -- Remove the line if it was deleted
            final_lines := (
                SELECT jsonb_agg(elem)
                FROM jsonb_array_elements(final_lines) AS elem
                WHERE elem->>'id' != line_changes.old_data->>'id'
            );
        END IF;
    END LOOP;

    -- Return final lines
    RETURN final_lines;
END;
$$;
-- this is not used at all