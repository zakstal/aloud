CREATE OR REPLACE FUNCTION public.get_screenplay_version(
    screenplayId uuid,
    versionNumber int,
    result_limit int,         -- Number of rows to return
    pagination_token text     -- Encoded token passed by the client for pagination
) RETURNS TABLE (
    line_id uuid,
    character_id uuid,
    type text,
    is_dialog boolean,
    text_content text,
    line_order int,
    audio_version_info jsonb,
    next_token text           -- Encoded token for the next page
) LANGUAGE plpgsql
AS $$
DECLARE
    last_seen_order int;
BEGIN
    -- Decode the token if provided
    IF pagination_token IS NOT NULL THEN
        BEGIN
            SELECT (convert_from(decode(pagination_token, 'base64'), 'UTF8'))::int INTO last_seen_order;
        EXCEPTION WHEN others THEN
            RAISE EXCEPTION 'Invalid pagination token format: %', pagination_token;
        END;
    END IF;

    RETURN QUERY
    SELECT 
        lns.id AS line_id,
        COALESCE(
            (al.old_data->>'character_id')::uuid, lns.character_id
        ) AS character_id,
        COALESCE(
            al.old_data->>'type', lns.type
        ) AS type,
        COALESCE(
            (al.old_data->>'isDialog')::boolean, lns."isDialog"
        ) AS is_dialog,
        COALESCE(
            al.old_data->>'text', lns.text
        ) AS text_content,
        COALESCE(
            (al.old_data->>'order')::int, lns."order"
        ) AS line_order,
        jsonb_agg(
            jsonb_build_object(
                'id', av.id,
                'line_id', av.line_id,
                'screenplay_id', av.screenplay_id,
                'version_number', av.version_number,
                'duration_in_seconds', av.duration_in_seconds,
                'audio_file_url', av.audio_file_url,
                'order', av."order",
                'created_at', av.created_at,
                'audio_character_version_id', av.audio_character_version_id,
                'audio_screenplay_version_id', av.audio_screenplay_version_id
            )
        ) AS audio_version,
        encode((MAX(lns."order")::text)::bytea, 'base64') AS next_token  -- Encode the next token
    FROM public.lines lns
    LEFT JOIN (
        SELECT * 
        FROM public.line_audit_log
        WHERE audio_screenplay_version_id = (
            SELECT id FROM public.audio_screenplay_versions
            WHERE screenplay_id = screenplayId
            AND (version_number > versionNumber OR versionNumber IS NULL)  -- Handle when versionNumber is NULL
            LIMIT 1
        )
    ) al ON al.line_id = lns.id
    LEFT JOIN public.audio_version av ON av.line_id = lns.id
    WHERE lns.screenplay_id = screenplayId
    AND (versionNumber IS NULL OR lns.created_version_number <= versionNumber)  -- Include all rows if versionNumber is NULL
    AND lns.deleted = false  -- Exclude lines where deleted is true
    AND (last_seen_order IS NULL OR lns."order" > last_seen_order)  -- Sentinel condition for pagination
    GROUP BY lns.id, lns.character_id, lns.type, lns."isDialog", lns.text, lns."order", lns.created_at, al.old_data
    ORDER BY lns."order" ASC
    LIMIT result_limit;
END;
$$;
