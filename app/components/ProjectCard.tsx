import { useState } from 'react';
import { AsanaProject } from '../types/asana';
import { getStatusColor, formatProgress, getProjectPriority } from '../lib/asana';
import { Calendar, Users, CheckCircle, Clock, AlertTriangle, Target } from 'lucide-react';

interface ProjectCardProps {
  project: AsanaProject;
  compact?: boolean;
  onClick?: () => void;
}

export function ProjectCard({ project, compact = false, onClick }: ProjectCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const statusColor = getStatusColor(project);
  const priority = getProjectPriority(project);

  // Helper function to get custom field value
  const getCustomFieldValue = (fieldName: string) => {
    const field = project.custom_fields.find(f => f.name === fieldName);
    return field?.display_value;
  };

  // Get badge values from custom fields
  const projectType = getCustomFieldValue('Project Type');
  const department = getCustomFieldValue('Department');
  const tiStage = getCustomFieldValue('T&I Stage');
  const tiPriority = getCustomFieldValue('TI Priority');

  const getStatusBadge = () => {
    // Only show status badge if there's an actual status update and it's recent
    if (!project.current_status?.color) {
      return null;
    }

    // Check if the status update is recent (within 30 days)
    const statusDate = project.current_status?.created_at ? new Date(project.current_status.created_at) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Don't show "Off Track" badge for old status updates
    if (statusColor === 'red' && statusDate && statusDate < thirtyDaysAgo) {
      return null;
    }

    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    
    switch (statusColor) {
      case 'green':
        return `${baseClasses} bg-success-50 text-success-700 border border-success-200`;
      case 'yellow':
        return `${baseClasses} bg-warning-50 text-warning-700 border border-warning-200`;
      case 'red':
        return `${baseClasses} bg-danger-50 text-danger-700 border border-danger-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border border-gray-200`;
    }
  };

  const getStatusText = () => {
    if (!project.current_status?.color) {
      return null;
    }

    // Check if the status update is recent (within 30 days)
    const statusDate = project.current_status?.created_at ? new Date(project.current_status.created_at) : null;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Don't show "Off Track" text for old status updates
    if (statusColor === 'red' && statusDate && statusDate < thirtyDaysAgo) {
      return null;
    }
    
    switch (statusColor) {
      case 'green':
        return 'On Track';
      case 'yellow':
        return 'At Risk';
      case 'red':
        return 'Off Track';
      default:
        return null;
    }
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Target className="w-4 h-4 text-green-500" />;
    }
  };

  const getProgressBarColor = () => {
    const percentage = project.progress?.percentage || 0;
    if (percentage >= 80) return 'bg-success-500';
    if (percentage >= 40) return 'bg-warning-500';
    return 'bg-danger-500';
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays}d left`, color: 'text-yellow-600' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-600' };
    }
  };

  const dueDate = formatDueDate(project.due_date);

  if (compact) {
    return (
      <div 
        className="bg-sonance-white dark:bg-sonance-charcoal rounded-lg border border-sonance-slate/20 dark:border-sonance-slate/40 p-3 hover:shadow-lg hover:border-sonance-gold/50 transition-all duration-200 cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sonance-dark dark:text-sonance-silver truncate">{project.name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              {(() => {
                const statusBadgeClass = getStatusBadge();
                return statusBadgeClass && (
                  <span className={statusBadgeClass}>
                    {getStatusText()}
                  </span>
                );
              })()}
              {project.progress && (
                <span className="text-xs text-sonance-mist">
                  {formatProgress(project)}
                </span>
              )}
            </div>
            {/* Compact Badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {projectType && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {projectType}
                </span>
              )}
              {tiPriority && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                  P{tiPriority}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getPriorityIcon()}
            {project.members.length > 0 && (
              <div className="flex -space-x-1">
                {project.members.slice(0, 3).map((member, index) => (
                  <img
                    key={member.gid}
                    src={member.photo?.image_128x128 || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=32`}
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
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-sonance-white dark:bg-sonance-charcoal rounded-lg border border-sonance-slate/20 dark:border-sonance-slate/40 p-4 hover:shadow-lg hover:border-sonance-gold/50 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{project.name}</h4>
            {getPriorityIcon()}
          </div>
          
          {project.current_status?.title && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {project.current_status.title}
            </p>
          )}
        </div>

        {(() => {
          const statusBadgeClass = getStatusBadge();
          return statusBadgeClass && (
            <span className={statusBadgeClass}>
              {getStatusText()}
            </span>
          );
        })()}
      </div>

      {/* Custom Field Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {projectType && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
            {projectType}
          </span>
        )}
        {department && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
            {department}
          </span>
        )}
        {tiStage && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
            {tiStage}
          </span>
        )}
        {tiPriority && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700">
            P{tiPriority}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {project.progress && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{formatProgress(project)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getProgressBarColor()}`}
              style={{ width: `${project.progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className="flex items-center space-x-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className={`text-sm ${dueDate.color}`}>
            {dueDate.text}
          </span>
        </div>
      )}

      {/* Team Members */}
      {project.members.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Team</span>
          </div>
          
          <div className="flex -space-x-1">
            {project.members.slice(0, 4).map((member) => (
              <img
                key={member.gid}
                src={member.photo?.image_128x128 || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=32`}
                alt={member.name}
                className="w-8 h-8 rounded-full border-2 border-white"
                title={member.name}
              />
            ))}
            {project.members.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-gray-600">+{project.members.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Fields */}
      {project.custom_fields && project.custom_fields.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {project.custom_fields.slice(0, 3).map((field) => (
              <div key={field.gid} className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">{field.name}:</span>
                <span className="text-xs font-medium text-gray-700">
                  {field.display_value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {project.completed && (
            <CheckCircle className="w-4 h-4 text-success-500" />
          )}
          <span className="text-xs text-gray-500">
            Updated {new Date(project.modified_at).toLocaleDateString()}
          </span>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          {showDetails ? 'Less' : 'More'} Details
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && project.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{project.notes}</p>
        </div>
      )}
    </div>
  );
}