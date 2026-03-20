import axios from 'axios';
import { AsanaProject, AsanaTask } from '../types/asana';

export class AsanaService {
  private apiClient: any;
  private teamId: string;

  constructor(accessToken: string, teamId: string) {
    this.teamId = teamId;
    this.apiClient = axios.create({
      baseURL: 'https://app.asana.com/api/1.0',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getProjects(): Promise<AsanaProject[]> {
    try {
      const response = await this.apiClient.get('/projects', {
        params: {
          team: this.teamId,
          opt_fields: [
            'name',
            'completed',
            'current_status.color',
            'current_status.text',
            'current_status.title',
            'custom_fields.gid',
            'custom_fields.name',
            'custom_fields.type',
            'custom_fields.display_value',
            'custom_fields.enum_options.gid',
            'custom_fields.enum_options.name',
            'custom_fields.enum_options.color',
            'team.gid',
            'team.name',
            'members.gid',
            'members.name',
            'members.email',
            'members.photo.image_128x128',
            'created_at',
            'modified_at',
            'due_date',
            'notes'
          ].join(',')
        }
      });

      const projects = response.data.data;
      
      // Get task counts for each project
      const projectsWithProgress = await Promise.all(
        projects.map(async (project: any) => {
          const progress = await this.getProjectProgress(project.gid);
          return {
            ...project,
            progress
          };
        })
      );

      return projectsWithProgress;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw new Error('Failed to fetch projects from Asana');
    }
  }

  async getProjectProgress(projectId: string) {
    try {
      const response = await this.apiClient.get(`/projects/${projectId}/tasks`, {
        params: {
          opt_fields: 'completed'
        }
      });

      const tasks = response.data.data;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((task: any) => task.completed).length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        percentage
      };
    } catch (error) {
      console.error(`Error fetching progress for project ${projectId}:`, error);
      return {
        completed_tasks: 0,
        total_tasks: 0,
        percentage: 0
      };
    }
  }

  async updateProjectStatus(projectId: string, statusColor: 'green' | 'yellow' | 'red', statusText: string) {
    try {
      const response = await this.apiClient.post(`/projects/${projectId}/project_statuses`, {
        data: {
          color: statusColor,
          text: statusText,
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error updating project status:', error);
      throw new Error('Failed to update project status');
    }
  }

  async getProjectTasks(projectId: string): Promise<AsanaTask[]> {
    try {
      const response = await this.apiClient.get(`/projects/${projectId}/tasks`, {
        params: {
          opt_fields: [
            'name',
            'completed',
            'assignee.gid',
            'assignee.name',
            'assignee.email',
            'due_date',
            'created_at',
            'modified_at'
          ].join(',')
        }
      });

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching tasks for project ${projectId}:`, error);
      throw new Error('Failed to fetch project tasks');
    }
  }
}

// Utility functions
export function getStatusColor(project: AsanaProject): 'green' | 'yellow' | 'red' {
  if (project.current_status?.color) {
    return project.current_status.color;
  }
  
  // Fallback based on progress
  const progress = project.progress?.percentage || 0;
  if (progress >= 80) return 'green';
  if (progress >= 40) return 'yellow';
  return 'red';
}

export function formatProgress(project: AsanaProject): string {
  if (!project.progress) return '0/0 (0%)';
  const { completed_tasks, total_tasks, percentage } = project.progress;
  return `${completed_tasks}/${total_tasks} (${percentage}%)`;
}

export function getProjectPriority(project: AsanaProject): 'high' | 'medium' | 'low' {
  const dueDate = project.due_date ? new Date(project.due_date) : null;
  const today = new Date();
  
  if (dueDate) {
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    if (daysUntilDue <= 7) return 'high';
    if (daysUntilDue <= 30) return 'medium';
  }
  
  return 'low';
}