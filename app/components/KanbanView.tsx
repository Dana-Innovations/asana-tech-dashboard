'use client';

import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { AsanaProject, KanbanColumn } from '../types/asana';
import { ProjectCard } from './ProjectCard';
import { ProjectModal } from './ProjectModal';
import { getStatusColor, getProjectStage, updateProjectStage } from '../lib/asana';

interface KanbanViewProps {
  projects: AsanaProject[];
  onProjectUpdate?: () => void;
}

export function KanbanView({ projects, onProjectUpdate }: KanbanViewProps) {
  const [selectedProject, setSelectedProject] = useState<AsanaProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    return [
      {
        id: 'backlog',
        title: 'Backlog',
        projects: projects.filter(p => getProjectStage(p) === 'backlog'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      },
      {
        id: 'definition',
        title: 'Definition',
        projects: projects.filter(p => getProjectStage(p) === 'definition'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      },
      {
        id: 'development',
        title: 'Development',
        projects: projects.filter(p => getProjectStage(p) === 'development'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      },
      {
        id: 'testing',
        title: 'Testing (Alpha)',
        projects: projects.filter(p => getProjectStage(p) === 'testing'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      },
      {
        id: 'pilot',
        title: 'Pilot (Beta)',
        projects: projects.filter(p => getProjectStage(p) === 'pilot'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      },
      {
        id: 'deployment',
        title: 'Deployment',
        projects: projects.filter(p => getProjectStage(p) === 'deployment'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      },
      {
        id: 'completion',
        title: 'Completion / Sustainment',
        projects: projects.filter(p => getProjectStage(p) === 'completion'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      },
      {
        id: 'eol',
        title: 'End of Life',
        projects: projects.filter(p => getProjectStage(p) === 'eol'),
        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
      }
    ];
  });

  // Update columns when projects change
  useEffect(() => {
    setColumns(prevColumns =>
      prevColumns.map(column => ({
        ...column,
        projects: projects.filter(p => getProjectStage(p) === column.id)
      }))
    );
  }, [projects]);

  const moveProject = async (projectId: string, targetColumnId: string) => {
    const sourceColumn = columns.find(col => 
      col.projects.some(p => p.gid === projectId)
    );
    
    const project = sourceColumn?.projects.find(p => p.gid === projectId);
    if (!project || !sourceColumn) return;

    // Optimistically update UI
    setColumns(prevColumns =>
      prevColumns.map(column => {
        if (column.id === sourceColumn.id) {
          return {
            ...column,
            projects: column.projects.filter(p => p.gid !== projectId)
          };
        }
        
        if (column.id === targetColumnId) {
          return {
            ...column,
            projects: [...column.projects, { ...project, stageField: targetColumnId }]
          };
        }
        
        return column;
      })
    );

    // Update project stage in Asana
    try {
      await updateProjectStage(projectId, targetColumnId);
      
      // Trigger a refresh of the project data
      if (onProjectUpdate) {
        onProjectUpdate();
      }
    } catch (error) {
      console.error('Failed to update project stage:', error);
      
      // Revert the optimistic update
      setColumns(prevColumns =>
        prevColumns.map(column => {
          if (column.id === targetColumnId) {
            return {
              ...column,
              projects: column.projects.filter(p => p.gid !== projectId)
            };
          }
          
          if (column.id === sourceColumn.id) {
            return {
              ...column,
              projects: [...column.projects, project]
            };
          }
          
          return column;
        })
      );
      
      // Show user-friendly error message
      alert('Failed to update project stage. Please try again.');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-h-[calc(100vh-140px)] px-2">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            onMoveProject={moveProject}
            onProjectClick={(project) => {
              setSelectedProject(project);
              setIsModalOpen(true);
            }}
          />
        ))}
        </div>
      </div>

      {/* Project Modal */}
      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
          onUpdate={(updatedProject) => {
            // Handle project update
            if (onProjectUpdate) {
              onProjectUpdate();
            }
          }}
        />
      )}
    </DndProvider>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  onMoveProject: (projectId: string, targetColumnId: string) => void;
  onProjectClick: (project: AsanaProject) => void;
}

function KanbanColumn({ column, onMoveProject, onProjectClick }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop({
    accept: 'project',
    drop: (item: { projectId: string }) => {
      onMoveProject(item.projectId, column.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const getColumnIcon = (columnId: string) => {
    switch (columnId) {
      case 'backlog':
        return '📋';
      case 'definition':
        return '📝';
      case 'development':
        return '⚙️';
      case 'testing':
        return '🧪';
      case 'pilot':
        return '🚀';
      case 'deployment':
        return '🌐';
      case 'completion':
        return '✅';
      case 'eol':
        return '🔚';
      default:
        return '📋';
    }
  };

  return (
    <div
      ref={drop as any}
      className={`min-h-[600px] flex-1 min-w-[280px] rounded-lg border-2 border-dashed transition-colors ${
        column.color
      } ${isOver ? 'border-primary-400 dark:border-primary-500 bg-primary-50 dark:bg-primary-900' : ''}`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getColumnIcon(column.id)}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
            {column.projects.length}
          </span>
        </div>
      </div>

      {/* Projects */}
      <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {column.projects.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No projects</p>
          </div>
        ) : (
          column.projects.map(project => (
            <DraggableProjectCard
              key={project.gid}
              project={project}
              onProjectClick={onProjectClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface DraggableProjectCardProps {
  project: AsanaProject;
  onProjectClick: (project: AsanaProject) => void;
}

function DraggableProjectCard({ project, onProjectClick }: DraggableProjectCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: 'project',
    item: { projectId: project.gid },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag as any}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <ProjectCard 
        project={project} 
        onClick={() => onProjectClick(project)}
      />
    </div>
  );
}