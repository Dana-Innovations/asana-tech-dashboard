'use client';

import { useState } from 'react';
import { AsanaProject } from '../types/asana';
import { X, Calendar, Users, Tag, FileText, ExternalLink, Save } from 'lucide-react';
import { formatProgress, updateProjectCustomField } from '../lib/asana';

interface ProjectModalProps {
  project: AsanaProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (project: AsanaProject) => void;
}

export function ProjectModal({ project, isOpen, onClose, onUpdate }: ProjectModalProps) {
  const [editedProject, setEditedProject] = useState<AsanaProject>(project);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update any changed custom fields
      if (editedProject.custom_fields && project.custom_fields) {
        for (const editedField of editedProject.custom_fields) {
          const originalField = project.custom_fields.find(f => f.gid === editedField.gid);
          if (originalField && editedField.display_value !== originalField.display_value) {
            // Find the enum option ID for the new value
            let fieldValue: string | null = editedField.display_value;
            if (editedField.type === 'enum' && editedField.enum_options) {
              const enumOption = editedField.enum_options.find(option => option.name === editedField.display_value);
              fieldValue = enumOption ? enumOption.gid : null;
            }
            
            await updateProjectCustomField(project.gid, editedField.gid, fieldValue);
          }
        }
      }

      if (onUpdate) {
        onUpdate(editedProject);
      }
      setIsEditing(false);
      
      // Refresh the page to show updated data
      window.location.reload();
      
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProject(project);
    setIsEditing(false);
  };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setEditedProject(prev => ({
      ...prev,
      custom_fields: prev.custom_fields?.map(field => 
        field.gid === fieldId 
          ? { ...field, display_value: value }
          : field
      ) || []
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            {isEditing ? (
              <input
                value={editedProject.name}
                onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-primary-500 w-full"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h2>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-sonance-gold text-white text-sm font-medium rounded-md hover:bg-sonance-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn-secondary text-sm"
              >
                Edit Metadata
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Status */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Status
              </h3>
              {project.current_status ? (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  project.current_status.color === 'green' ? 'bg-success-50 dark:bg-success-900 text-success-700 dark:text-success-300' :
                  project.current_status.color === 'yellow' ? 'bg-warning-50 dark:bg-warning-900 text-warning-700 dark:text-warning-300' :
                  'bg-danger-50 dark:bg-danger-900 text-danger-700 dark:text-danger-300'
                }`}>
                  {project.current_status.color === 'green' ? 'On Track' :
                   project.current_status.color === 'yellow' ? 'At Risk' : 'Off Track'}
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No status set</span>
              )}
              {project.current_status?.title && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{project.current_status.title}</p>
              )}
            </div>

            {/* Progress */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Progress</h3>
              {project.progress ? (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">{project.progress.percentage}%</span>
                    <span className="text-gray-500 dark:text-gray-500">{formatProgress(project)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        project.progress.percentage >= 80 ? 'bg-success-500' :
                        project.progress.percentage >= 40 ? 'bg-warning-500' : 'bg-danger-500'
                      }`}
                      style={{ width: `${project.progress.percentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No progress data</span>
              )}
            </div>

            {/* Due Date */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Due Date
              </h3>
              {project.due_date ? (
                <div>
                  <p className="text-gray-900 dark:text-white">{new Date(project.due_date).toLocaleDateString()}</p>
                  {(() => {
                    const dueDate = new Date(project.due_date);
                    const now = new Date();
                    const diffTime = dueDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                      return <p className="text-red-600 dark:text-red-400 text-sm">{Math.abs(diffDays)} days overdue</p>;
                    } else if (diffDays === 0) {
                      return <p className="text-orange-600 dark:text-orange-400 text-sm">Due today</p>;
                    } else if (diffDays <= 7) {
                      return <p className="text-yellow-600 dark:text-yellow-400 text-sm">{diffDays} days left</p>;
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No due date set</span>
              )}
            </div>
          </div>

          {/* Team Members */}
          {project.members.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Team Members
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.members.map((member) => (
                  <div key={member.gid} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img
                      src={member.photo?.image_128x128 || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=40`}
                      alt={member.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Notes
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{project.notes}</p>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {project.custom_fields && project.custom_fields.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Project Metadata
                {isEditing && <span className="text-sm font-normal text-gray-500 ml-2">(Click to edit)</span>}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editedProject.custom_fields?.map((field) => (
                  <div key={field.gid} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {field.name}
                    </label>
                    
                    {isEditing ? (
                      // Edit mode - show form controls
                      field.type === 'enum' && field.enum_options ? (
                        <select
                          value={field.display_value || ''}
                          onChange={(e) => handleCustomFieldChange(field.gid, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sonance-gold focus:border-sonance-gold"
                        >
                          <option value="">Select {field.name}</option>
                          {field.enum_options.map((option) => (
                            <option key={option.gid} value={option.name}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'text' ? (
                        <input
                          type="text"
                          value={field.display_value || ''}
                          onChange={(e) => handleCustomFieldChange(field.gid, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sonance-gold focus:border-sonance-gold"
                          placeholder={`Enter ${field.name}`}
                        />
                      ) : (
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-md text-gray-500 dark:text-gray-400">
                          {field.display_value || 'Not editable'}
                        </div>
                      )
                    ) : (
                      // View mode - show current values with badges
                      <div className="flex items-center">
                        {field.display_value ? (
                          ['Project Type', 'Department', 'TI Priority', 'T&I Priority'].includes(field.name) ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              field.name === 'Project Type' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : field.name === 'Department' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }`}>
                              {field.display_value}
                            </span>
                          ) : field.name === 'GitHub Repo' && field.display_value.startsWith('http') ? (
                            <a
                              href={field.display_value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-800 dark:text-primary-400 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">
                                {field.display_value.split('/').slice(-1)[0].replace('.git', '')}
                              </span>
                            </a>
                          ) : (
                            <span className="text-gray-900 dark:text-white">{field.display_value}</span>
                          )
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 italic">Not set</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date(project.modified_at).toLocaleDateString()}
            </div>
            <a 
              href={`https://app.asana.com/0/${project.gid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 border border-sonance-gold/50 text-sm font-medium rounded-md text-sonance-gold hover:bg-sonance-gold hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sonance-gold focus:ring-offset-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Asana</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}