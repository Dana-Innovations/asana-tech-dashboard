'use client';

import { useState, useMemo } from 'react';
import { AsanaProject, SortField, SortOrder } from '../types/asana';
import { getStatusColor, getProjectPriority, getPriorityBadgeClasses } from '../lib/asana';
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown
} from 'lucide-react';

interface StoplightViewProps {
  projects: AsanaProject[];
}

export function StoplightView({ projects }: StoplightViewProps) {
  const [sortField, setSortField] = useState<SortField>('modified_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortField) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'modified_at':
          valueA = new Date(a.modified_at);
          valueB = new Date(b.modified_at);
          break;
        case 'due_date':
          valueA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          valueB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          break;
        case 'progress':
          valueA = a.progress?.percentage || 0;
          valueB = b.progress?.percentage || 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getStatusDot = (project: AsanaProject) => {
    const statusColor = getStatusColor(project);
    
    switch (statusColor) {
      case 'green':
        return <div className="w-3 h-3 bg-emerald-500 rounded-full" />;
      case 'yellow':
        return <div className="w-3 h-3 bg-amber-500 rounded-full" />;
      case 'red':
        return <div className="w-3 h-3 bg-red-500 rounded-full" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getCustomFieldValue = (project: AsanaProject, fieldName: string) => {
    const field = project.custom_fields?.find(f => f.name === fieldName);
    return field?.display_value || '-';
  };

  const getProjectTypeBadge = (project: AsanaProject) => {
    const typeValue = getCustomFieldValue(project, 'Project Type');
    if (typeValue === '-') return '-';
    
    const typeCode = typeValue.split(' - ')[0] || typeValue;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
        {typeCode}
      </span>
    );
  };

  const getOwnerInitials = (project: AsanaProject) => {
    if (project.members.length === 0) return '-';
    
    const owner = project.members[0]; // Use first team member as owner
    const names = owner.name.split(' ');
    if (names.length === 1) {
      return names[0].slice(0, 8); // First name, max 8 chars
    }
    // First name only
    return names[0];
  };

  const getPriorityBadge = (project: AsanaProject) => {
    const priority = getProjectPriority(project);
    if (!priority) return '-';
    
    const badgeClasses = getPriorityBadgeClasses(priority);
    if (!badgeClasses) return priority;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${badgeClasses}`}>
        {priority}
      </span>
    );
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? 'now' : `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months}mo ago`;
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      <span>{children}</span>
      {sortField === field ? (
        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      ) : (
        <ArrowUpDown className="w-4 h-4 opacity-40" />
      )}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                Status
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                <SortButton field="name">Project Name</SortButton>
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                Type
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                Department
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                Stage
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                Priority
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                Owner
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                <SortButton field="modified_at">Updated</SortButton>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedProjects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-gray-500 dark:text-gray-400">No projects found</p>
                </td>
              </tr>
            ) : (
              sortedProjects.map((project, index) => (
                <tr
                  key={project.gid}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50'
                  }`}
                >
                  {/* Status */}
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      {getStatusDot(project)}
                    </div>
                  </td>

                  {/* Project Name */}
                  <td className="px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate text-sm">
                        {project.name}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-2">
                    {getProjectTypeBadge(project)}
                  </td>

                  {/* Department */}
                  <td className="px-3 py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {getCustomFieldValue(project, 'Department')}
                    </span>
                  </td>

                  {/* Stage */}
                  <td className="px-3 py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {getCustomFieldValue(project, 'T&I Stage')}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-2">
                    {getPriorityBadge(project)}
                  </td>

                  {/* Owner */}
                  <td className="px-3 py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {getOwnerInitials(project)}
                    </span>
                  </td>

                  {/* Updated */}
                  <td className="px-3 py-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatRelativeDate(project.modified_at)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}