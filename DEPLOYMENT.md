# Deployment Checklist

## Prerequisites Setup
- [ ] Supabase project created
- [ ] Asana Personal Access Token obtained  
- [ ] Technology Team ID identified
- [ ] GitHub repository created
- [ ] Vercel account ready

## Database Setup
- [ ] Run `supabase-schema.sql` in Supabase SQL editor
- [ ] Verify tables created: `projects`, `sync_log`, `project_stats` view
- [ ] Test database connection

## Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Set `NEXT_PUBLIC_ASANA_TOKEN`
- [ ] Set `NEXT_PUBLIC_ASANA_TEAM_ID`

## Local Testing
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test Asana API connection
- [ ] Test Supabase sync
- [ ] Verify both Kanban and Stoplight views
- [ ] Test filtering and sorting
- [ ] Test drag-and-drop functionality

## GitHub Setup
- [ ] Push code to GitHub repository
- [ ] Verify all files committed
- [ ] Set repository visibility (private recommended)

## Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Add environment variables in Vercel settings
- [ ] Deploy and test production build
- [ ] Verify live site functionality
- [ ] Test with real Asana data

## Post-Deployment
- [ ] Share dashboard URL with team
- [ ] Set up monitoring/alerts (optional)
- [ ] Plan regular sync intervals
- [ ] Document any customizations needed

## Troubleshooting
- [ ] Check Vercel function logs for API errors
- [ ] Verify Supabase RLS policies
- [ ] Test Asana API rate limits
- [ ] Confirm team member access

---

**Production URL**: `https://technology-project-dashboard.vercel.app` (replace with actual)
**Repository**: `https://github.com/Dana-Innovations/technology-project-dashboard` (replace with actual)