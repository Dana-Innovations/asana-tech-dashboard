import { useState } from 'react';
import { ViewMode, AsanaProject } from '../types/asana';
import { Grid, List, Calendar, Users, TrendingUp, GanttChart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { VersionBadge } from './VersionBadge';
import { getProjectStage } from '../lib/asana';

interface DashboardHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  lastSync: Date | null;
  projectCount: number;
  projects: AsanaProject[];
  dashboardName?: string;
}

export function DashboardHeader({
  viewMode,
  onViewModeChange,
  lastSync,
  projectCount,
  projects,
  dashboardName
}: DashboardHeaderProps) {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return date.toLocaleDateString();
  };

  // Calculate summary statistics
  const getProjectStats = () => {
    const stats = {
      total: projects.length,
      development: 0,
      testing: 0,
      completed: 0,
      backlog: 0,
      definition: 0
    };

    projects.forEach(project => {
      const stage = getProjectStage(project);
      switch (stage) {
        case 'development':
          stats.development++;
          break;
        case 'testing':
          stats.testing++;
          break;
        case 'completion':
          stats.completed++;
          break;
        case 'backlog':
          stats.backlog++;
          break;
        case 'definition':
          stats.definition++;
          break;
      }
    });

    return stats;
  };

  const stats = getProjectStats();

  return (
    <header className="sticky top-0 z-40 bg-slate-700 dark:bg-sonance-charcoal shadow-lg">
      <div className="w-full px-6 py-3">
        {/* Main Header Row */}
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Back to Dashboards">
              <ArrowLeft className="w-5 h-5 text-sonance-mist hover:text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-sonance-white tracking-tight">
                {dashboardName || 'Asana Dashboard'}
              </h1>
              <p className="text-sm text-sonance-mist mt-1">
                Last sync: {formatLastSync(lastSync)}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-sonance-slate/30 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-sonance-beam text-white shadow-sm'
                    : 'text-sonance-silver hover:text-sonance-white hover:bg-sonance-slate/20'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Kanban</span>
              </button>

              <button
                onClick={() => onViewModeChange('roadmap')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'roadmap'
                    ? 'bg-sonance-beam text-white shadow-sm'
                    : 'text-sonance-silver hover:text-sonance-white hover:bg-sonance-slate/20'
                }`}
              >
                <GanttChart className="w-4 h-4" />
                <span>Roadmap</span>
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-sonance-beam text-white shadow-sm'
                    : 'text-sonance-silver hover:text-sonance-white hover:bg-sonance-slate/20'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-sonance-beam text-white shadow-sm'
                    : 'text-sonance-silver hover:text-sonance-white hover:bg-sonance-slate/20'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Grid</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Version Badge */}
            <VersionBadge />
          </div>
        </div>


      </div>
    </header>
  );
}