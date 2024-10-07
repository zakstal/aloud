-- Create audit log table for lines
CREATE TABLE public.line_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id uuid NOT NULL,
    screenplay_id uuid NOT NULL,
    audio_screenplay_version_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    old_data jsonb, -- previous state of the line (for updates and deletes)
    new_data jsonb, -- new state of the line (for inserts and updates)
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (line_id) REFERENCES public.lines(id) ON DELETE CASCADE,
    FOREIGN KEY (screenplay_id) REFERENCES public.screenplays(id) ON DELETE CASCADE,
    FOREIGN KEY (audio_screenplay_version_id) REFERENCES public.audio_screenplay_versions(id) ON DELETE CASCADE
);

-- Trigger function to log changes to the lines table
CREATE OR REPLACE FUNCTION log_line_changes() 
RETURNS TRIGGER AS $$
DECLARE
    version_id uuid;
BEGIN

    -- Fetch the latest version or create a new one (customize this logic as needed)
    SELECT id INTO version_id
    FROM public.audio_screenplay_versions
    WHERE screenplay_id = NEW.screenplay_id
    ORDER BY created_at DESC
    LIMIT 1;


    -- Insert the change into the audit log
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.line_audit_log (line_id, screenplay_id, audio_screenplay_version_id, action, new_data, created_at)
        VALUES (NEW.id, NEW.screenplay_id, version_id, 'insert', row_to_json(NEW), now());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.line_audit_log (line_id, screenplay_id, audio_screenplay_version_id, action, old_data, new_data, created_at)
        VALUES (OLD.id, OLD.screenplay_id, version_id, 'update', row_to_json(OLD), row_to_json(NEW), now());
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


