-- -- Trigger function to log changes to the lines table
-- CREATE OR REPLACE FUNCTION log_line_changes_delete() 
-- RETURNS TRIGGER AS $$
-- DECLARE
--     version_id uuid;
-- BEGIN

--     -- Fetch the latest version or create a new one (customize this logic as needed)
--     SELECT id INTO version_id  
--     FROM public.audio_screenplay_versions
--     WHERE screenplay_id = OLD.screenplay_id
--     ORDER BY created_at DESC
--     LIMIT 1;

--     -- Insert the change into the audit log
--     IF TG_OP = 'DELETE' THEN
--         INSERT INTO public.line_audit_log (line_id, screenplay_id, audio_screenplay_version_id, action, old_data, created_at)
--         VALUES (OLD.id, OLD.screenplay_id, version_id, 'delete', row_to_json(OLD), now());
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_log_line_changes_delete
-- BEFORE DELETE ON public.lines
-- FOR EACH ROW EXECUTE FUNCTION log_line_changes_delete();