'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AsanaProject, ViewMode, DashboardFilter } from '../../types/asana';
import { AsanaService } from '../../lib/asana';
import { ProjectStore } from '../../lib/supabase';
import { KanbanView } from '../../components/KanbanView';
import { StoplightView } from '../../components/StoplightView';
import { RoadmapView } from '../../components/RoadmapView';
import { ListView } from '../../components/ListView';
import { ProjectsGrid } from '../../components/ProjectsGrid';
import { DashboardHeader } from '../../components/DashboardHeader';
import { FilterPanel } from '../../components/FilterPanel';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FeedbackButton } from '../../components/FeedbackButton';
import { DashboardAuth } from '../../components/DashboardAuth';

interface DashboardConfig {
  id: string;
  slug: string;
  name: string;
  description: string;
  asanaToken: string;
  asanaTeamId?: string;
  asanaPortfolioId?: string;
  isPasswordProtected: boolean;
}

export default function Dashboard() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AsanaProject[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [filters, setFilters] = useState<DashboardFilter>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const projectStore = new ProjectStore();

  const loadDashboardConfig = async () => {
    try {
      setCheckingAuth(true);
      setError(null);

      // Mock dashboard loading for now - this will be replaced with Supabase
      if (slug === 'tech-projects') {
        const config: DashboardConfig = {
          id: '1',
          slug: 'tech-projects',
          name: 'Technology Project Dashboard',
          description: 'Project management dashboard for the technology team',
          asanaToken: process.env.NEXT_PUBLIC_ASANA_TOKEN || '',
          asanaTeamId: process.env.NEXT_PUBLIC_ASANA_TEAM_ID,
          asanaPortfolioId: process.env.NEXT_PUBLIC_ASANA_PORTFOLIO_ID,
          isPasswordProtected: true // ENABLED PASSWORD PROTECTION
        };
        setDashboardConfig(config);
        setIsAuthenticated(true);
      } else {
        // Check if dashboard exists in database
        // For now, show 404
        setError('Dashboard not found');
        setTimeout(() => router.push('/'), 3000);
        return;
      }
    } catch (error) {
      console.error('Error loading dashboard config:', error);
      setError('Failed to load dashboard configuration');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  // Load dashboard configuration and check authentication
  useEffect(() => {
    loadDashboardConfig();
  }, [slug]);

  // Load projects after authentication is confirmed
  useEffect(() => {
    if (isAuthenticated && dashboardConfig) {
      loadProjects();
      
      // Set up real-time subscription
      const subscription = projectStore.subscribeToProjects((updatedProjects) => {
        setProjects(updatedProjects);
        setLastSync(new Date());
      }, dashboardConfig.id);

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAuthenticated, dashboardConfig]);

  useEffect(() => {
    applyFilters();
  }, [projects, filters]);

  // Auto-sync every 3 minutes
  useEffect(() => {
    if (!isAuthenticated || !dashboardConfig) return;
    
    const interval = setInterval(() => {
      // Only sync if we're not already syncing and have the required config
      if (!syncing && dashboardConfig.asanaToken) {
        syncProjects();
      }
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearInterval(interval);
  }, [syncing, isAuthenticated, dashboardConfig]); // Re-run if syncing state or auth changes

  const loadProjects = async () => {
    if (!dashboardConfig) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load cached projects first for instant display
      const cachedProjects = await projectStore.getProjects(dashboardConfig.id);
      if (cachedProjects.length > 0) {
        setProjects(cachedProjects);
        setLoading(false);
      }

      // Get last sync time
      const lastSyncTime = await projectStore.getLastSyncTime(dashboardConfig.id);
      setLastSync(lastSyncTime);

      // Determine if we need to sync
      const shouldSync = !lastSyncTime || 
        (Date.now() - lastSyncTime.getTime()) > 5 * 60 * 1000; // 5 minutes

      if (shouldSync && dashboardConfig.asanaToken) {
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
    if (!dashboardConfig) return;
    
    try {
      setSyncing(true);
      setError(null);

      const { asanaToken, asanaTeamId, asanaPortfolioId } = dashboardConfig;

      if (!asanaToken) {
        throw new Error('Asana token missing for this dashboard.');
      }

      const asanaService = new AsanaService(asanaToken, asanaTeamId || '', asanaPortfolioId || '');
      const freshProjects = await projectStore.syncProjects(asanaService, dashboardConfig.id);
      
      setProjects(freshProjects);
      await projectStore.updateSyncTime(dashboardConfig.id);
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

    // Status filter - now handles arrays
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(project => {
        const statusColor = project.current_status?.color;
        return statusColor && filters.status!.includes(statusColor);
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

    // Assignee filter - now handles arrays
    if (filters.assignee && filters.assignee.length > 0) {
      filtered = filtered.filter(project =>
        project.members.some(member => 
          filters.assignee!.includes(member.gid)
        )
      );
    }

    // Project type filter - now handles arrays
    if (filters.projectType && filters.projectType.length > 0) {
      filtered = filtered.filter(project => {
        const projectTypeField = project.custom_fields.find(field => field.name === 'Project Type');
        return projectTypeField?.display_value && filters.projectType!.includes(projectTypeField.display_value);
      });
    }

    // Department filter - now handles arrays
    if (filters.department && filters.department.length > 0) {
      filtered = filtered.filter(project => {
        const departmentField = project.custom_fields.find(field => field.name === 'Department');
        return departmentField?.display_value && filters.department!.includes(departmentField.display_value);
      });
    }

    // T&I Priority filter - now handles arrays
    if (filters.tiPriority && filters.tiPriority.length > 0) {
      filtered = filtered.filter(project => {
        const tiPriorityField = project.custom_fields.find(field => field.name === 'T&I Priority');
        return tiPriorityField?.display_value && filters.tiPriority!.includes(tiPriorityField.display_value);
      });
    }

    setFilteredProjects(filtered);
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Show error if dashboard not found
  if (error && !dashboardConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Dashboard Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Redirecting to dashboard list...
          </p>
        </div>
      </div>
    );
  }

  // Show authentication form if dashboard is password protected
  if (dashboardConfig?.isPasswordProtected && !isAuthenticated) {
    return (
      <DashboardAuth
        dashboardName={dashboardConfig.name}
        onAuthSuccess={handleAuthSuccess}
        slug={slug}
      />
    );
  }

  // Show loading while fetching projects
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Main dashboard interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-sonance-dark">
      <DashboardHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        lastSync={lastSync}
        projectCount={projects.length}
        projects={projects}
        dashboardName={dashboardConfig?.name}
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

      <main className="w-full px-6 py-8">
        {viewMode === 'kanban' && <KanbanView projects={filteredProjects} onProjectUpdate={loadProjects} />}
        {viewMode === 'stoplight' && <StoplightView projects={filteredProjects} />}
        {viewMode === 'roadmap' && <RoadmapView projects={filteredProjects} />}
        {viewMode === 'list' && <ListView projects={filteredProjects} />}
        {viewMode === 'grid' && <ProjectsGrid projects={filteredProjects} />}
      </main>

      {/* Fixed UI Elements */}
      <FeedbackButton />
    </div>
  );
}