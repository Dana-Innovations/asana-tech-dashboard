'use client';

import { useState, useMemo } from 'react';
import { AsanaProject, SortField, SortOrder } from '../types/asana';
import { getStatusColor, formatProgress, getProjectPriority } from '../lib/asana';
import { 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Users, 
  AlertTriangle, 
  Clock, 
  Target,
  ArrowUpDown,
  ExternalLink
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

  const getStatusIndicator = (project: AsanaProject) => {
    const statusColor = getStatusColor(project);
    
    switch (statusColor) {
      case 'green':
        return <div className="w-4 h-4 bg-success-500 rounded-full" />;
      case 'yellow':
        return <div className="w-4 h-4 bg-warning-500 rounded-full" />;
      case 'red':
        return <div className="w-4 h-4 bg-danger-500 rounded-full" />;
      default:
        return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  const getPriorityIcon = (project: AsanaProject) => {
    const priority = getProjectPriority(project);
    
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Target className="w-4 h-4 text-green-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getDueDateStatus = (project: AsanaProject) => {
    if (!project.due_date) return null;
    
    const date = new Date(project.due_date);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d left`, color: 'text-yellow-600' };
    }
    return null;
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-left font-medium text-gray-900 dark:text-white hover:text-primary-600 transition-colors"
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
          </div>
          <div className="col-span-4">
            <SortButton field="name">Project Name</SortButton>
          </div>
          <div className="col-span-2">
            <SortButton field="progress">Progress</SortButton>
          </div>
          <div className="col-span-2">
            <SortButton field="due_date">Due Date</SortButton>
          </div>
          <div className="col-span-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Team</span>
          </div>
          <div className="col-span-1">
            <SortButton field="modified_at">Updated</SortButton>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedProjects.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500 dark:text-gray-400">No projects found</p>
          </div>
        ) : (
          sortedProjects.map((project) => {
            const dueDateStatus = getDueDateStatus(project);
            
            return (
              <div
                key={project.gid}
                className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Status Indicator */}
                  <div className="col-span-1">
                    <div className="flex items-center space-x-2">
                      {getStatusIndicator(project)}
                      {getPriorityIcon(project)}
                    </div>
                  </div>

                  {/* Project Name */}
                  <div className="col-span-4">
                    <div className="flex items-center space-x-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                          {project.name}
                        </h4>
                        {project.current_status?.title && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                            {project.current_status.title}
                          </p>
                        )}
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="col-span-2">
                    {project.progress ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{project.progress.percentage}%</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {project.progress.completed_tasks}/{project.progress.total_tasks}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              project.progress.percentage >= 80 
                                ? 'bg-success-500' 
                                : project.progress.percentage >= 40 
                                ? 'bg-warning-500' 
                                : 'bg-danger-500'
                            }`}
                            style={{ width: `${project.progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(project.due_date)}
                        </div>
                        {dueDateStatus && (
                          <div className={`text-xs ${dueDateStatus.color}`}>
                            {dueDateStatus.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="col-span-2">
                    {project.members.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div className="flex -space-x-1">
                          {project.members.slice(0, 3).map((member) => (
                            <img
                              key={member.gid}
                              src={member.photo?.image_128x128 || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=24`}
                              alt={member.name}
                              className="w-6 h-6 rounded-full border-2 border-white"
                              title={member.name}
                            />
                          ))}
                          {project.members.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{project.members.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>

                  {/* Updated */}
                  <div className="col-span-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(project.modified_at)}
                    </span>
                  </div>
                </div>

                {/* Custom Fields (Expandable) */}
                {project.custom_fields && project.custom_fields.length > 0 && (
                  <div className="mt-2 grid grid-cols-12 gap-4">
                    <div className="col-span-12 ml-6">
                      <div className="flex flex-wrap gap-2">
                        {project.custom_fields.slice(0, 5).map((field) => (
                          <span
                            key={field.gid}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            <span className="font-medium">{field.name}:</span>
                            <span className="ml-1">{field.display_value}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {sortedProjects.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{sortedProjects.length} projects</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                <span>On Track</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                <span>At Risk</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
                <span>Off Track</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}