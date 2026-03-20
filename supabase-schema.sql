-- Create projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  asana_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  status_color TEXT CHECK (status_color IN ('green', 'yellow', 'red')),
  status_text TEXT,
  status_title TEXT,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  team_id TEXT,
  team_name TEXT,
  members JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL,
  due_date DATE,
  notes TEXT,
  completed_tasks INTEGER DEFAULT 0,
  total_tasks INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync log table
CREATE TABLE sync_log (
  id SERIAL PRIMARY KEY,
  last_sync TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_asana_id ON projects(asana_id);
CREATE INDEX idx_projects_status_color ON projects(status_color);
CREATE INDEX idx_projects_completed ON projects(completed);
CREATE INDEX idx_projects_due_date ON projects(due_date);
CREATE INDEX idx_projects_modified_at ON projects(modified_at);
CREATE INDEX idx_projects_team_id ON projects(team_id);

-- Create RLS (Row Level Security) policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON projects
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON sync_log
  FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial sync log entry
INSERT INTO sync_log (last_sync) VALUES (NOW());

-- Create a view for project statistics
CREATE VIEW project_stats AS
SELECT
  COUNT(*) as total_projects,
  COUNT(*) FILTER (WHERE completed = true) as completed_projects,
  COUNT(*) FILTER (WHERE status_color = 'green') as on_track_projects,
  COUNT(*) FILTER (WHERE status_color = 'yellow') as at_risk_projects,
  COUNT(*) FILTER (WHERE status_color = 'red') as off_track_projects,
  AVG(progress_percentage)::NUMERIC(5,2) as avg_progress,
  COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND completed = false) as overdue_projects
FROM projects;

-- Grant select access to the view
GRANT SELECT ON project_stats TO authenticated;