import { useState } from 'react';
import { ViewMode } from '../types/asana';
import { RefreshCw, Grid, List, Calendar, Users, TrendingUp } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface DashboardHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSync: () => void;
  syncing: boolean;
  lastSync: Date | null;
  projectCount: number;
}

export function DashboardHeader({
  viewMode,
  onViewModeChange,
  onSync,
  syncing,
  lastSync,
  projectCount
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

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Technology & Innovation PLM
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {projectCount} projects • {formatLastSync(lastSync)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('kanban')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => onViewModeChange('stoplight')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'stoplight'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <List className="w-3 h-3" />
                <span>Stoplight</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Sync Button */}
            <button
              onClick={onSync}
              disabled={syncing}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                syncing
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>


      </div>
    </header>
  );
}