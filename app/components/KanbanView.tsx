'use client';

import { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { AsanaProject, KanbanColumn } from '../types/asana';
import { ProjectCard } from './ProjectCard';
import { getStatusColor } from '../lib/asana';

interface KanbanViewProps {
  projects: AsanaProject[];
}

export function KanbanView({ projects }: KanbanViewProps) {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    return [
      {
        id: 'green',
        title: 'On Track',
        projects: projects.filter(p => getStatusColor(p) === 'green'),
        color: 'bg-success-50 border-success-200'
      },
      {
        id: 'yellow',
        title: 'At Risk',
        projects: projects.filter(p => getStatusColor(p) === 'yellow'),
        color: 'bg-warning-50 border-warning-200'
      },
      {
        id: 'red',
        title: 'Off Track',
        projects: projects.filter(p => getStatusColor(p) === 'red'),
        color: 'bg-danger-50 border-danger-200'
      },
      {
        id: 'completed',
        title: 'Completed',
        projects: projects.filter(p => p.completed),
        color: 'bg-gray-50 border-gray-200'
      }
    ];
  });

  // Update columns when projects change
  useEffect(() => {
    setColumns(prevColumns =>
      prevColumns.map(column => ({
        ...column,
        projects: column.id === 'completed' 
          ? projects.filter(p => p.completed)
          : projects.filter(p => !p.completed && getStatusColor(p) === column.id)
      }))
    );
  }, [projects]);

  const moveProject = (projectId: string, targetColumnId: string) => {
    const sourceColumn = columns.find(col => 
      col.projects.some(p => p.gid === projectId)
    );
    
    const project = sourceColumn?.projects.find(p => p.gid === projectId);
    if (!project || !sourceColumn) return;

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
            projects: [...column.projects, project]
          };
        }
        
        return column;
      })
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            onMoveProject={moveProject}
          />
        ))}
      </div>
    </DndProvider>
  );
}

interface KanbanColumnProps {
  column: KanbanColumn;
  onMoveProject: (projectId: string, targetColumnId: string) => void;
}

function KanbanColumn({ column, onMoveProject }: KanbanColumnProps) {
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
      case 'green':
        return '🟢';
      case 'yellow':
        return '🟡';
      case 'red':
        return '🔴';
      case 'completed':
        return '✅';
      default:
        return '📋';
    }
  };

  return (
    <div
      ref={drop as any}
      className={`flex-shrink-0 w-80 rounded-lg border-2 border-dashed transition-colors ${
        column.color
      } ${isOver ? 'border-primary-400 bg-primary-50' : ''}`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getColumnIcon(column.id)}</span>
            <h3 className="font-semibold text-gray-900">{column.title}</h3>
          </div>
          <span className="text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
            {column.projects.length}
          </span>
        </div>
      </div>

      {/* Projects */}
      <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {column.projects.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No projects</p>
          </div>
        ) : (
          column.projects.map(project => (
            <DraggableProjectCard
              key={project.gid}
              project={project}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface DraggableProjectCardProps {
  project: AsanaProject;
}

function DraggableProjectCard({ project }: DraggableProjectCardProps) {
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
      <ProjectCard project={project} />
    </div>
  );
}