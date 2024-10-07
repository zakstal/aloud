-- Trigger to execute the function on changes to the lines table
CREATE TRIGGER trigger_log_line_changes
AFTER INSERT OR UPDATE ON public.lines
FOR EACH ROW EXECUTE FUNCTION log_line_changes();