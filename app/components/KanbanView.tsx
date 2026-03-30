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
        color: 'bg-white dark:bg-sonance-charcoal'
      },
      {
        id: 'definition',
        title: 'Definition',
        projects: projects.filter(p => getProjectStage(p) === 'definition'),
        color: 'bg-white dark:bg-sonance-charcoal'
      },
      {
        id: 'development',
        title: 'Development',
        projects: projects.filter(p => getProjectStage(p) === 'development'),
        color: 'bg-white dark:bg-sonance-charcoal'
      },
      {
        id: 'testing',
        title: 'Testing (Alpha)',
        projects: projects.filter(p => getProjectStage(p) === 'testing'),
        color: 'bg-white dark:bg-sonance-charcoal'
      },
      {
        id: 'pilot',
        title: 'Pilot (Beta)',
        projects: projects.filter(p => getProjectStage(p) === 'pilot'),
        color: 'bg-white dark:bg-sonance-charcoal'
      },
      {
        id: 'deployment',
        title: 'Deployment',
        projects: projects.filter(p => getProjectStage(p) === 'deployment'),
        color: 'bg-white dark:bg-sonance-charcoal'
      },
      {
        id: 'completion',
        title: 'Completion / Sustainment',
        projects: projects.filter(p => getProjectStage(p) === 'completion'),
        color: 'bg-white dark:bg-sonance-charcoal'
      },
      {
        id: 'eol',
        title: 'End of Life',
        projects: projects.filter(p => getProjectStage(p) === 'eol'),
        color: 'bg-white dark:bg-sonance-charcoal'
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
      // Don't trigger onProjectUpdate() here — the optimistic UI update is sufficient.
      // Refreshing data causes a race condition where getProjectStage() mapping
      // doesn't round-trip correctly, making the card disappear.
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
      <div className="overflow-x-auto pb-8">
        <div className="flex gap-6 min-h-[calc(100vh-280px)] px-6">
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



  return (
    <div
      ref={drop as any}
      className={`min-h-[calc(100vh-300px)] flex-1 min-w-[360px] rounded-xl transition-colors ${
        column.color
      } ${isOver ? 'border-2 border-sonance-beam bg-sonance-beam/5 dark:bg-sonance-beam/10' : 'border border-gray-200 dark:border-sonance-slate/50'} 
      shadow-lg hover:shadow-xl hover:border-sonance-beam/40 dark:hover:border-sonance-beam/60 transition-all duration-200`}
    >
      {/* Column Header */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-sonance-beam rounded-t-xl"></div>
        <div className="bg-gray-50 dark:bg-sonance-slate/30 p-5 border-b border-gray-200 dark:border-sonance-slate/40 rounded-t-xl pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 dark:text-sonance-silver tracking-tight">{column.title}</h3>
            </div>
            <span className="text-sm font-medium text-sonance-beam bg-sonance-beam/10 border border-sonance-beam/20 px-3 py-1 rounded-full">
              {column.projects.length}
            </span>
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="p-5 space-y-4 max-h-[calc(100vh-340px)] overflow-y-auto pb-8">
        {column.projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-sonance-mist">
            <p className="text-sm font-medium">No Projects</p>
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