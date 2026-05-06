-- Adds the project start_on column so the dashboard can persist and display
-- both the start AND end (due_date) dates on cached project rows.
-- Apply via Supabase SQL editor or `supabase db push`.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS start_on DATE;

CREATE INDEX IF NOT EXISTS idx_projects_start_on ON projects(start_on);
