import { createClient } from '@supabase/supabase-js';
import { AsanaProject } from '../types/asana';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export class ProjectStore {
  async saveProjects(projects: AsanaProject[], dashboardId?: string) {
    if (!supabase) {
      console.warn('Supabase not configured - skipping save');
      return;
    }
    try {
      const { error } = await supabase
        .from('projects')
        .upsert(
          projects.map(project => ({
            asana_id: project.gid,
            dashboard_id: dashboardId || null,
            name: project.name,
            completed: project.completed,
            status_color: project.current_status?.color || null,
            status_text: project.current_status?.text || null,
            status_title: project.current_status?.title || null,
            custom_fields: project.custom_fields,
            team_id: project.team?.gid || null,
            team_name: project.team?.name || null,
            members: project.members,
            created_at: project.created_at,
            modified_at: project.modified_at,
            due_date: project.due_date || null,
            notes: project.notes || null,
            completed_tasks: project.progress?.completed_tasks || 0,
            total_tasks: project.progress?.total_tasks || 0,
            progress_percentage: project.progress?.percentage || 0,
            updated_at: new Date().toISOString(),
          })),
          { 
            onConflict: dashboardId ? 'asana_id,dashboard_id' : 'asana_id',
            ignoreDuplicates: false 
          }
        );

      if (error) throw error;
      
      console.log(`Saved ${projects.length} projects to database`);
    } catch (error) {
      console.error('Error saving projects to database:', error);
      throw error;
    }
  }

  async getProjects(dashboardId?: string): Promise<AsanaProject[]> {
    if (!supabase) {
      console.warn('Supabase not configured - returning empty array');
      return [];
    }
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('modified_at', { ascending: false });
      
      // Filter by dashboard ID if provided
      if (dashboardId) {
        query = query.eq('dashboard_id', dashboardId);
      } else {
        // For backward compatibility, include projects with null dashboard_id
        query = query.is('dashboard_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(row => ({
        gid: row.asana_id,
        name: row.name,
        completed: row.completed,
        current_status: row.status_color ? {
          color: row.status_color,
          text: row.status_text,
          title: row.status_title,
        } : undefined,
        custom_fields: row.custom_fields || [],
        team: row.team_id ? {
          gid: row.team_id,
          name: row.team_name,
        } : undefined,
        members: row.members || [],
        created_at: row.created_at,
        modified_at: row.modified_at,
        due_date: row.due_date,
        notes: row.notes,
        progress: {
          completed_tasks: row.completed_tasks || 0,
          total_tasks: row.total_tasks || 0,
          percentage: row.progress_percentage || 0,
        }
      }));
    } catch (error) {
      console.error('Error fetching projects from database:', error);
      throw error;
    }
  }

  async syncProjects(asanaService: any, dashboardId?: string): Promise<AsanaProject[]> {
    try {
      console.log(`Starting project sync for dashboard: ${dashboardId || 'default'}...`);
      
      // Fetch latest data from Asana
      const asanaProjects = await asanaService.getProjects();
      
      // Save to database
      await this.saveProjects(asanaProjects, dashboardId);
      
      console.log('Project sync completed successfully');
      return asanaProjects;
    } catch (error) {
      console.error('Error during project sync:', error);
      
      // Fallback to cached data
      console.log('Falling back to cached data...');
      return await this.getProjects(dashboardId);
    }
  }

  // Real-time subscription for project updates
  subscribeToProjects(callback: (projects: AsanaProject[]) => void, dashboardId?: string) {
    if (!supabase) {
      console.warn('Supabase not configured - no real-time updates');
      return { unsubscribe: () => {} };
    }
    const subscription = supabase
      .channel(`projects-changes-${dashboardId || 'default'}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'projects' 
        }, 
        async () => {
          const projects = await this.getProjects(dashboardId);
          callback(projects);
        }
      )
      .subscribe();

    return subscription;
  }

  async getLastSyncTime(dashboardId?: string): Promise<Date | null> {
    if (!supabase) return null;
    try {
      let query = supabase
        .from('sync_log')
        .select('synced_at')
        .order('synced_at', { ascending: false })
        .limit(1);
      
      // Filter by dashboard ID if provided
      if (dashboardId) {
        query = query.eq('dashboard_id', dashboardId);
      } else {
        // For backward compatibility, include entries with null dashboard_id
        query = query.is('dashboard_id', null);
      }
      
      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? new Date(data.synced_at) : null;
    } catch (error) {
      console.error('Error fetching last sync time:', error);
      return null;
    }
  }

  async updateSyncTime(dashboardId?: string) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('sync_log')
        .insert({ 
          dashboard_id: dashboardId || null,
          synced_at: new Date().toISOString() 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating sync time:', error);
    }
  }
}