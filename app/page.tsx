'use client';

import { useState, useEffect } from 'react';
import { AsanaProject, ViewMode, DashboardFilter } from './types/asana';
import { AsanaService } from './lib/asana';
import { ProjectStore } from './lib/supabase';
import { KanbanView } from './components/KanbanView';
import { StoplightView } from './components/StoplightView';
import { DashboardHeader } from './components/DashboardHeader';
import { FilterPanel } from './components/FilterPanel';
import { LoadingSpinner } from './components/LoadingSpinner';
import { VersionBadge } from './components/VersionBadge';
import { FeedbackButton } from './components/FeedbackButton';

export default function Dashboard() {
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AsanaProject[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<DashboardFilter>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const projectStore = new ProjectStore();

  useEffect(() => {
    loadProjects();
    
    // Set up real-time subscription
    const subscription = projectStore.subscribeToProjects((updatedProjects) => {
      setProjects(updatedProjects);
      setLastSync(new Date());
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, filters]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load cached projects first for instant display
      const cachedProjects = await projectStore.getProjects();
      if (cachedProjects.length > 0) {
        setProjects(cachedProjects);
        setLoading(false);
      }

      // Get last sync time
      const lastSyncTime = await projectStore.getLastSyncTime();
      setLastSync(lastSyncTime);

      // Determine if we need to sync
      const shouldSync = !lastSyncTime || 
        (Date.now() - lastSyncTime.getTime()) > 5 * 60 * 1000; // 5 minutes

      if (shouldSync && process.env.NEXT_PUBLIC_ASANA_TOKEN && process.env.NEXT_PUBLIC_ASANA_TEAM_ID) {
        await syncProjects();
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setError('Failed to load projects. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const syncProjects = async () => {
    try {
      setSyncing(true);
      setError(null);

      const asanaToken = process.env.NEXT_PUBLIC_ASANA_TOKEN;
      const teamId = process.env.NEXT_PUBLIC_ASANA_TEAM_ID;
      const portfolioId = process.env.NEXT_PUBLIC_ASANA_PORTFOLIO_ID;

      if (!asanaToken || !teamId) {
        throw new Error('Asana configuration missing. Please check environment variables.');
      }

      const asanaService = new AsanaService(asanaToken, teamId, portfolioId);
      const freshProjects = await projectStore.syncProjects(asanaService);
      
      setProjects(freshProjects);
      await projectStore.updateSyncTime();
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync error:', error);
      setError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(project => {
        const statusColor = project.current_status?.color;
        return statusColor === filters.status;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchLower) ||
        project.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Assignee filter
    if (filters.assignee) {
      filtered = filtered.filter(project =>
        project.members.some(member => 
          member.gid === filters.assignee ||
          member.name.toLowerCase().includes(filters.assignee!.toLowerCase())
        )
      );
    }

    // Date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(project => {
        if (!project.due_date) return false;
        const dueDate = new Date(project.due_date);
        return dueDate >= filters.dateRange!.start && dueDate <= filters.dateRange!.end;
      });
    }

    setFilteredProjects(filtered);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSync={syncProjects}
        syncing={syncing}
        lastSync={lastSync}
        projectCount={projects.length}
      />

      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      <FilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        projects={projects}
      />

      <main className="w-full px-4 py-6">
        {viewMode === 'kanban' ? (
          <KanbanView 
            projects={filteredProjects} 
            onProjectUpdate={loadProjects}
          />
        ) : (
          <StoplightView projects={filteredProjects} />
        )}
      </main>

      {/* Fixed UI Elements */}
      <VersionBadge />
      <FeedbackButton />
    </div>
  );
}