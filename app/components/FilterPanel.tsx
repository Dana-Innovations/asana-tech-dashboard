import { useState, useEffect } from 'react';
import { Search, Filter, X, Settings, Save, Upload } from 'lucide-react';
import { DashboardFilter, AsanaProject, FilterPreset } from '../types/asana';

interface FilterPanelProps {
  filters: DashboardFilter;
  onFiltersChange: (filters: DashboardFilter) => void;
  projects: AsanaProject[];
}

export function FilterPanel({ filters, onFiltersChange, projects }: FilterPanelProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showSaveInFilters, setShowSaveInFilters] = useState(false);

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('dashboard-filter-presets');
    if (savedPresets) {
      try {
        const parsedPresets = JSON.parse(savedPresets);
        setPresets(parsedPresets.map((preset: any) => ({
          ...preset,
          createdAt: new Date(preset.createdAt)
        })));
      } catch (error) {
        console.error('Error loading presets:', error);
      }
    }
  }, []);

  // Save presets to localStorage whenever presets change
  useEffect(() => {
    localStorage.setItem('dashboard-filter-presets', JSON.stringify(presets));
  }, [presets]);

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const toggleArrayFilter = <T extends string>(
    filterKey: keyof DashboardFilter,
    value: T
  ) => {
    const currentValues = (filters[filterKey] as T[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...filters,
      [filterKey]: newValues.length > 0 ? newValues : undefined
    });
  };

  const clearFilter = (filterKey: keyof DashboardFilter) => {
    onFiltersChange({
      ...filters,
      [filterKey]: undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({ search: filters.search });
  };

  const hasActiveFilters = () => {
    return filters.status?.length || filters.assignee?.length || filters.projectType?.length || 
           filters.department?.length || filters.tiPriority?.length || filters.search;
  };

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: newPresetName.trim(),
      filters: { ...filters },
      createdAt: new Date()
    };
    
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setShowSavePreset(false);
    setShowSaveInFilters(false);
  };

  const loadPreset = (preset: FilterPreset) => {
    onFiltersChange(preset.filters);
    setShowPresets(false);
  };

  const deletePreset = (presetId: string) => {
    setPresets(presets.filter(p => p.id !== presetId));
  };

  // Get unique values from all projects
  const uniqueAssignees = Object.values(
    projects.flatMap(project => project.members).reduce((acc, member) => {
      acc[member.gid] = { gid: member.gid, name: member.name };
      return acc;
    }, {} as Record<string, { gid: string; name: string }>)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const uniqueProjectTypes = Array.from(new Set(
    projects.map(project => 
      project.custom_fields.find(field => field.name === 'Project Type')?.display_value
    ).filter((value): value is string => Boolean(value))
  )).sort();

  const uniqueDepartments = Array.from(new Set(
    projects.map(project => 
      project.custom_fields.find(field => field.name === 'Department')?.display_value
    ).filter((value): value is string => Boolean(value))
  )).sort();

  const uniqueTiPriorities = Array.from(new Set(
    projects.map(project => 
      project.custom_fields.find(field => field.name === 'T&I Priority')?.display_value
    ).filter((value): value is string => Boolean(value))
  )).sort();

  const statusOptions = [
    { value: 'green' as const, label: 'On Track', colorClass: 'bg-success-500 hover:bg-success-600 text-white' },
    { value: 'yellow' as const, label: 'At Risk', colorClass: 'bg-warning-500 hover:bg-warning-600 text-white' },
    { value: 'red' as const, label: 'Off Track', colorClass: 'bg-danger-500 hover:bg-danger-600 text-white' }
  ];

  const BadgeGroup = ({ 
    title, 
    values, 
    selectedValues, 
    colorClass, 
    onToggle 
  }: {
    title: string;
    values: string[];
    selectedValues?: string[];
    colorClass?: string;
    onToggle: (value: string) => void;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-sonance-mist">
        {title}
      </label>
      <div className="flex flex-wrap gap-2">
        {values.map(value => {
          const isSelected = selectedValues?.includes(value) || false;
          return (
            <button
              key={value}
              onClick={() => onToggle(value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isSelected
                  ? colorClass || 'bg-sonance-gold text-sonance-charcoal'
                  : 'bg-sonance-slate/20 dark:bg-sonance-slate/40 text-sonance-mist hover:bg-sonance-slate/30 dark:hover:bg-sonance-slate/50'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );

  const StatusBadgeGroup = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-sonance-mist">
        Status
      </label>
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(option => {
          const isSelected = filters.status?.includes(option.value) || false;
          return (
            <button
              key={option.value}
              onClick={() => toggleArrayFilter('status', option.value)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isSelected
                  ? option.colorClass
                  : option.value === 'green' ? 'bg-success-50 text-success-600 hover:bg-success-100' :
                    option.value === 'yellow' ? 'bg-warning-50 text-warning-600 hover:bg-warning-100' :
                    'bg-danger-50 text-danger-600 hover:bg-danger-100'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const MemberBadgeGroup = () => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-sonance-mist">
        Team Members
      </label>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        {uniqueAssignees.map(assignee => {
          const isSelected = filters.assignee?.includes(assignee.gid) || false;
          return (
            <button
              key={assignee.gid}
              onClick={() => toggleArrayFilter('assignee', assignee.gid)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                isSelected
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
              }`}
            >
              {assignee.name}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-sonance-white dark:bg-sonance-charcoal border-b border-sonance-slate/20 dark:border-sonance-slate/40">
      <div className="w-full px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Search - stays outside */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={filters.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-sonance-slate/30 dark:border-sonance-slate/50 rounded bg-sonance-white dark:bg-sonance-slate text-sonance-dark dark:text-sonance-silver placeholder-sonance-mist focus:ring-2 focus:ring-sonance-gold focus:border-sonance-gold transition-colors"
              />
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
                showFilters
                  ? 'bg-sonance-gold text-sonance-charcoal'
                  : 'bg-sonance-slate/20 dark:bg-sonance-slate/40 text-sonance-mist hover:bg-sonance-slate/30 dark:hover:bg-sonance-slate/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {hasActiveFilters() && !showFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-sonance-gold text-sonance-charcoal rounded-full">
                  {(filters.status?.length || 0) + (filters.assignee?.length || 0) + (filters.projectType?.length || 0) + (filters.department?.length || 0) + (filters.tiPriority?.length || 0)}
                </span>
              )}
            </button>

            {/* Presets Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded bg-sonance-slate/20 dark:bg-sonance-slate/40 text-sonance-mist hover:bg-sonance-slate/30 dark:hover:bg-sonance-slate/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Presets</span>
              </button>

              {showPresets && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-sonance-white dark:bg-sonance-charcoal border border-sonance-slate/30 dark:border-sonance-slate/50 rounded shadow-lg z-50">
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-sonance-dark dark:text-sonance-silver">Filter Presets</span>
                      <button
                        onClick={() => setShowSavePreset(!showSavePreset)}
                        className="text-xs text-sonance-gold hover:text-sonance-gold/80"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>

                    {showSavePreset && (
                      <div className="mb-3 p-2 border border-sonance-slate/20 rounded">
                        <input
                          type="text"
                          placeholder="Preset name..."
                          value={newPresetName}
                          onChange={(e) => setNewPresetName(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-sonance-slate/30 rounded mb-2"
                          onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={savePreset}
                            className="px-2 py-1 text-xs bg-sonance-gold text-sonance-charcoal rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setShowSavePreset(false)}
                            className="px-2 py-1 text-xs text-sonance-mist"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {presets.length === 0 ? (
                        <p className="text-xs text-sonance-mist italic">No saved presets</p>
                      ) : (
                        presets.map(preset => (
                          <div key={preset.id} className="flex items-center justify-between p-2 hover:bg-sonance-slate/10 rounded">
                            <button
                              onClick={() => loadPreset(preset)}
                              className="text-xs text-sonance-dark dark:text-sonance-silver hover:text-sonance-gold flex-1 text-left"
                            >
                              {preset.name}
                            </button>
                            <button
                              onClick={() => deletePreset(preset.id)}
                              className="text-xs text-sonance-mist hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-sonance-mist hover:text-sonance-dark dark:hover:text-sonance-silver"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-sonance-slate/20 dark:border-sonance-slate/40">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <StatusBadgeGroup />
              <MemberBadgeGroup />
              
              <BadgeGroup
                title="Project Type"
                values={uniqueProjectTypes}
                selectedValues={filters.projectType}
                colorClass="bg-blue-500 text-white hover:bg-blue-600"
                onToggle={(value) => toggleArrayFilter('projectType', value)}
              />
              
              <BadgeGroup
                title="Department"
                values={uniqueDepartments}
                selectedValues={filters.department}
                colorClass="bg-green-500 text-white hover:bg-green-600"
                onToggle={(value) => toggleArrayFilter('department', value)}
              />
              
              <BadgeGroup
                title="T&I Priority"
                values={uniqueTiPriorities}
                selectedValues={filters.tiPriority}
                colorClass="bg-red-500 text-white hover:bg-red-600"
                onToggle={(value) => toggleArrayFilter('tiPriority', value)}
              />
            </div>

            {/* Save Current Filters as Preset */}
            {hasActiveFilters() && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowSaveInFilters(!showSaveInFilters)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-sonance-gold hover:text-sonance-gold/80"
                >
                  <Save className="w-4 h-4" />
                  <span>Save as Preset</span>
                </button>
                {showSaveInFilters && (
                  <div className="mt-3 p-3 border border-sonance-slate/20 dark:border-sonance-slate/40 rounded bg-sonance-white dark:bg-sonance-charcoal">
                    <input
                      type="text"
                      placeholder="Enter preset name..."
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-sonance-slate/30 dark:border-sonance-slate/50 rounded bg-sonance-white dark:bg-sonance-slate text-sonance-dark dark:text-sonance-silver placeholder-sonance-mist focus:ring-2 focus:ring-sonance-gold focus:border-sonance-gold transition-colors mb-3"
                      onKeyPress={(e) => e.key === 'Enter' && savePreset()}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={savePreset}
                        className="px-3 py-2 text-sm bg-sonance-gold text-sonance-charcoal rounded font-medium hover:bg-sonance-gold/90 transition-colors"
                        disabled={!newPresetName.trim()}
                      >
                        Save Preset
                      </button>
                      <button
                        onClick={() => {
                          setShowSaveInFilters(false);
                          setNewPresetName('');
                        }}
                        className="px-3 py-2 text-sm text-sonance-mist hover:text-sonance-dark dark:hover:text-sonance-silver transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                Search: {filters.search}
                <button
                  onClick={() => handleSearchChange('')}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status?.map(status => (
              <span key={status} className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium ${
                status === 'green' ? 'bg-success-50 text-success-700' :
                status === 'yellow' ? 'bg-warning-50 text-warning-700' :
                'bg-danger-50 text-danger-700'
              }`}>
                {status === 'green' ? 'On Track' : status === 'yellow' ? 'At Risk' : 'Off Track'}
                <button
                  onClick={() => toggleArrayFilter('status', status)}
                  className="ml-2 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.assignee?.map(assigneeId => (
              <span key={assigneeId} className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700">
                {uniqueAssignees.find(a => a.gid === assigneeId)?.name}
                <button
                  onClick={() => toggleArrayFilter('assignee', assigneeId)}
                  className="ml-2 text-purple-500 hover:text-purple-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.projectType?.map(type => (
              <span key={type} className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                {type}
                <button
                  onClick={() => toggleArrayFilter('projectType', type)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.department?.map(dept => (
              <span key={dept} className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                {dept}
                <button
                  onClick={() => toggleArrayFilter('department', dept)}
                  className="ml-2 text-green-500 hover:text-green-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.tiPriority?.map(priority => (
              <span key={priority} className="inline-flex items-center px-3 py-1 rounded text-xs font-medium bg-red-50 text-red-700">
                Priority {priority}
                <button
                  onClick={() => toggleArrayFilter('tiPriority', priority)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}