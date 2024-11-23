create or replace function get_line_counts(screenplayid uuid)
RETURNS TABLE (
  complete_count BIGINT,
  incomplete_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN av.audio_file_url IS NOT NULL THEN 1 END) AS complete_count,
    COUNT(CASE WHEN av.audio_file_url IS NULL THEN 1 END) AS incomplete_count
  FROM lines l
  LEFT JOIN audio_version av ON l.id = av.line_id
  WHERE l.screenplay_id = screenplayid
    AND l.deleted = FALSE
    AND l.text IS NOT NULL
    AND l."isDialog" = TRUE;
END;
$$ LANGUAGE plpgsql;
