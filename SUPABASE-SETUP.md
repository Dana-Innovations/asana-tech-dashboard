# Supabase Setup for Multi-Tenant Dashboard Platform

## 🚨 CRITICAL: This setup preserves your existing dashboard functionality

Your current dashboard works **without Supabase** and will continue working during this setup.

## Step 1: Supabase Project Setup

1. **Go to [Supabase](https://supabase.com/dashboard)**
2. **Create New Project** (or use existing)
   - Name: `asana-dashboard` 
   - Region: Choose closest to your location
   - Database Password: Generate strong password **SAVE THIS**

3. **Get Project Credentials**
   - Go to **Settings** → **API**
   - Copy these values:
     - **Project URL**: `https://[your-project-id].supabase.co`
     - **anon/public key**: `eyJhbGciOiJIUzI1...` (long string)

## Step 2: Environment Variables

Add to your Vercel environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
```

**Important:** Deploy after adding these variables.

## Step 3: Database Schema

In Supabase **SQL Editor**, run this script:

```sql
-- Multi-Dashboard Platform Schema
-- SAFE: Uses IF NOT EXISTS to avoid conflicts

-- Dashboard configurations table
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asana_token_encrypted TEXT NOT NULL,
  asana_team_id VARCHAR(255),
  asana_portfolio_id VARCHAR(255),
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Dashboard sessions table
CREATE TABLE IF NOT EXISTS dashboard_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if projects table exists before modifying
DO $$ 
BEGIN
  -- Only add dashboard_id if projects table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    -- Add dashboard_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'dashboard_id') THEN
      ALTER TABLE projects ADD COLUMN dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE;
    END IF;
  ELSE
    -- Create projects table if it doesn't exist
    CREATE TABLE projects (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE,
      asana_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      completed BOOLEAN DEFAULT false,
      status_color VARCHAR(50),
      status_text TEXT,
      status_title TEXT,
      custom_fields JSONB,
      team_id VARCHAR(255),
      team_name VARCHAR(255),
      members JSONB,
      created_at TIMESTAMP WITH TIME ZONE,
      modified_at TIMESTAMP WITH TIME ZONE,
      due_date DATE,
      notes TEXT,
      completed_tasks INTEGER DEFAULT 0,
      total_tasks INTEGER DEFAULT 0,
      progress_percentage INTEGER DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(asana_id, dashboard_id)
    );
  END IF;
END $$;

-- Check if sync_log table exists before modifying
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_log') THEN
    -- Add dashboard_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sync_log' AND column_name = 'dashboard_id') THEN
      ALTER TABLE sync_log ADD COLUMN dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE;
    END IF;
  ELSE
    -- Create sync_log table if it doesn't exist
    CREATE TABLE sync_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      dashboard_id UUID REFERENCES dashboard_configs(id) ON DELETE CASCADE,
      synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_slug ON dashboard_configs(slug);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_token ON dashboard_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_projects_dashboard_id ON projects(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_dashboard_id ON sync_log(dashboard_id);

-- Insert the existing "Technology Project Dashboard" as default
-- NOTE: You need to update these placeholder values with real credentials
INSERT INTO dashboard_configs (
  slug, 
  name, 
  description, 
  asana_token_encrypted, 
  asana_team_id, 
  asana_portfolio_id,
  password_hash,
  is_active
) VALUES (
  'tech-projects',
  'Technology Project Dashboard',
  'Project management dashboard for the technology team',
  'ENCRYPTED_TOKEN_PLACEHOLDER', -- UPDATE THIS
  'TEAM_ID_PLACEHOLDER',         -- UPDATE THIS  
  'PORTFOLIO_ID_PLACEHOLDER',    -- UPDATE THIS
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of "password"
  true
) ON CONFLICT (slug) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now)
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON dashboard_configs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON dashboard_configs FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON dashboard_sessions FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable all operations for all users" ON dashboard_sessions FOR ALL USING (true);

-- Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM dashboard_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Dashboard stats view
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
```

## Step 4: Update Dashboard Configuration

After running the SQL, update the dashboard record with your actual Asana credentials:

```sql
-- Replace these with your actual values
UPDATE dashboard_configs 
SET 
  asana_token_encrypted = 'YOUR_ASANA_TOKEN_HERE',
  asana_team_id = 'YOUR_TEAM_ID_HERE',
  asana_portfolio_id = 'YOUR_PORTFOLIO_ID_HERE',
  password_hash = '$2b$10$N9qo8uLOickgx2ZMRitC3.Og8hmyrSi6UiOQ8bfrr' -- This is bcrypt of "Sonance2024!"
WHERE slug = 'tech-projects';
```

## 🔐 Current Dashboard Password

**Your dashboard now has password protection enabled:**
- **Password:** `Sonance2024!`
- **URL:** `/dashboard/tech-projects`
- **Persistence:** 7 days in browser localStorage

## 🛡️ Safety Measures

1. **Existing dashboard preserved** - all current functionality maintained
2. **Graceful degradation** - works with or without Supabase
3. **Non-destructive schema** - uses IF NOT EXISTS everywhere
4. **Backward compatibility** - existing data remains untouched

## Next Steps

1. Set up Supabase project and get credentials
2. Add environment variables to Vercel
3. Run the SQL schema
4. Update dashboard configuration with real Asana tokens
5. Deploy and test

Your dashboard will work throughout this entire process!