-- Multi-Dashboard Platform Schema
-- Extends existing schema to support multiple dashboards

-- Dashboard configurations table
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
  name VARCHAR(255) NOT NULL, -- Display name
  description TEXT,
  asana_token_encrypted TEXT NOT NULL, -- Encrypted Asana token
  asana_team_id VARCHAR(255),
  asana_portfolio_id VARCHAR(255),
  password_hash TEXT, -- Optional password protection (bcrypt)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Dashboard sessions table (for password auth persistence)
CREATE TABLE IF NOT EXISTS dashboard_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing projects table to reference dashboard
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE;

-- Update sync_log table to reference dashboard
ALTER TABLE sync_log 
ADD COLUMN IF NOT EXISTS dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_slug ON dashboard_configs(slug);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_token ON dashboard_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_projects_dashboard_id ON projects(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_dashboard_id ON sync_log(dashboard_id);

-- Insert the existing "Technology Project Dashboard" as default
INSERT INTO dashboard_configs (
  slug, 
  name, 
  description, 
  asana_token_encrypted, 
  asana_team_id, 
  asana_portfolio_id,
  is_active
) VALUES (
  'tech-projects',
  'Technology Project Dashboard',
  'Project management dashboard for the technology team',
  'PLACEHOLDER_ENCRYPTED_TOKEN', -- This needs to be set with actual encrypted token
  'PLACEHOLDER_TEAM_ID',         -- This needs to be set with actual team ID
  'PLACEHOLDER_PORTFOLIO_ID',    -- This needs to be set with actual portfolio ID
  true
) ON CONFLICT (slug) DO NOTHING;

-- RLS Policies (if using Row Level Security)
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_sessions ENABLE ROW LEVEL SECURITY;

-- Allow read access to dashboard configs (public dashboards)
CREATE POLICY IF NOT EXISTS "Public dashboard configs are viewable by everyone" 
ON dashboard_configs FOR SELECT 
USING (true);

-- Allow insert/update/delete for dashboard configs (restrict in application layer)
CREATE POLICY IF NOT EXISTS "Dashboard configs can be managed" 
ON dashboard_configs FOR ALL 
USING (true);

-- Allow read access to dashboard sessions
CREATE POLICY IF NOT EXISTS "Dashboard sessions are viewable by everyone" 
ON dashboard_sessions FOR SELECT 
USING (true);

-- Allow insert/update/delete for dashboard sessions
CREATE POLICY IF NOT EXISTS "Dashboard sessions can be managed" 
ON dashboard_sessions FOR ALL 
USING (true);

-- Update existing projects policy to include dashboard_id
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;
CREATE POLICY IF NOT EXISTS "Public projects are viewable by everyone" 
ON projects FOR SELECT 
USING (true);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions (runs every hour)
-- Note: This requires pg_cron extension which may not be available on all Supabase plans
-- SELECT cron.schedule('cleanup-expired-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');

-- View for dashboard stats
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  dc.id,
  dc.slug,
  dc.name,
  COUNT(p.id) as project_count,
  COUNT(CASE WHEN p.completed = false THEN 1 END) as active_projects,
  COUNT(CASE WHEN p.completed = true THEN 1 END) as completed_projects,
  MAX(sl.synced_at) as last_sync
FROM dashboard_configs dc
LEFT JOIN projects p ON dc.id = p.dashboard_id
LEFT JOIN sync_log sl ON dc.id = sl.dashboard_id
WHERE dc.is_active = true
GROUP BY dc.id, dc.slug, dc.name
ORDER BY dc.created_at;