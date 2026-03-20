import { useState } from 'react';
import { Search, Filter, X, Users, Calendar } from 'lucide-react';
import { DashboardFilter, AsanaProject } from '../types/asana';

interface FilterPanelProps {
  filters: DashboardFilter;
  onFiltersChange: (filters: DashboardFilter) => void;
  projects: AsanaProject[];
}

export function FilterPanel({ filters, onFiltersChange, projects }: FilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleStatusChange = (status: 'green' | 'yellow' | 'red' | undefined) => {
    onFiltersChange({ ...filters, status });
  };

  const handleAssigneeChange = (assignee: string) => {
    onFiltersChange({ ...filters, assignee: assignee || undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.status || filters.search || filters.assignee || filters.dateRange;

  // Get unique assignees from all projects
  const uniqueAssignees = Array.from(
    new Set(
      projects.flatMap(project => 
        project.members.map(member => ({ gid: member.gid, name: member.name }))
      )
    )
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleStatusChange(undefined)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    !filters.status
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleStatusChange('green')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filters.status === 'green'
                      ? 'bg-success-500 text-white'
                      : 'bg-success-50 text-success-600 hover:bg-success-100'
                  }`}
                >
                  On Track
                </button>
                <button
                  onClick={() => handleStatusChange('yellow')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filters.status === 'yellow'
                      ? 'bg-warning-500 text-white'
                      : 'bg-warning-50 text-warning-600 hover:bg-warning-100'
                  }`}
                >
                  At Risk
                </button>
                <button
                  onClick={() => handleStatusChange('red')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    filters.status === 'red'
                      ? 'bg-danger-500 text-white'
                      : 'bg-danger-50 text-danger-600 hover:bg-danger-100'
                  }`}
                >
                  Off Track
                </button>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showAdvanced
                  ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Assignee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Team Member
              </label>
              <select
                value={filters.assignee || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All members</option>
                {uniqueAssignees.map(assignee => (
                  <option key={assignee.gid} value={assignee.gid}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Project Type (Custom Field Example) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="">All types</option>
                <option value="feature">Feature Development</option>
                <option value="integration">Integration</option>
                <option value="research">Research</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                Search: {filters.search}
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                filters.status === 'green' ? 'bg-success-50 text-success-700' :
                filters.status === 'yellow' ? 'bg-warning-50 text-warning-700' :
                'bg-danger-50 text-danger-700'
              }`}>
                Status: {filters.status === 'green' ? 'On Track' : 
                        filters.status === 'yellow' ? 'At Risk' : 'Off Track'}
                <button
                  onClick={() => handleStatusChange(undefined)}
                  className="ml-2 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.assignee && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                Assignee: {uniqueAssignees.find(a => a.gid === filters.assignee)?.name}
                <button
                  onClick={() => handleAssigneeChange('')}
                  className="ml-2 text-purple-500 hover:text-purple-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}