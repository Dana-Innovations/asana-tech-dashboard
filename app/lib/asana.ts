import axios from 'axios';
import { AsanaProject, AsanaTask } from '../types/asana';

export class AsanaService {
  private apiClient: any;
  private teamId: string;
  private portfolioId?: string;

  constructor(accessToken: string, teamId: string, portfolioId?: string) {
    this.teamId = teamId;
    this.portfolioId = portfolioId;
    this.apiClient = axios.create({
      baseURL: 'https://app.asana.com/api/1.0',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async getProjects(): Promise<AsanaProject[]> {
    // If portfolio ID is provided, fetch from portfolio instead of team
    if (this.portfolioId) {
      return this.getPortfolioProjects();
    }
    
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

  async getPortfolioProjects(): Promise<AsanaProject[]> {
    try {
      const response = await this.apiClient.get(`/portfolios/${this.portfolioId}/items`, {
        params: {
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
      
      // Get task counts for each project (with rate limiting)
      const projectsWithProgress: AsanaProject[] = [];
      for (const project of projects) {
        const progress = await this.getProjectProgress(project.gid);
        projectsWithProgress.push({
          ...project,
          custom_fields: project.custom_fields || [],
          members: project.members || [],
          progress
        });
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return projectsWithProgress;
    } catch (error) {
      console.error('Error fetching portfolio projects:', error);
      throw new Error('Failed to fetch projects from Asana portfolio');
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

  async updateProjectCustomField(projectId: string, customFieldId: string, value: string) {
    try {
      const response = await this.apiClient.put(`/projects/${projectId}`, {
        data: {
          custom_fields: {
            [customFieldId]: value
          }
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error updating project custom field:', error);
      throw new Error('Failed to update project custom field');
    }
  }

  async getCustomFields(): Promise<any[]> {
    try {
      const response = await this.apiClient.get('/custom_fields', {
        params: {
          workspace: '1201171894258423', // Derick's workspace ID
          opt_fields: 'gid,name,type,enum_options.gid,enum_options.name'
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      return [];
    }
  }

  async createProjectStageField(): Promise<string | null> {
    try {
      // First check if the field already exists
      const existingFields = await this.getCustomFields();
      const existingField = existingFields.find(field => 
        field.name === 'Project Stage' || field.name === 'Dashboard Stage'
      );

      if (existingField) {
        return existingField.gid;
      }

      // Create the custom field with all stage options
      const response = await this.apiClient.post('/custom_fields', {
        data: {
          name: 'Project Stage',
          type: 'enum',
          workspace: '1201171894258423',
          enum_options: [
            { name: 'Backlog', color: 'gray' },
            { name: 'Definition', color: 'blue' },
            { name: 'Development', color: 'purple' },
            { name: 'Testing (Alpha)', color: 'yellow' },
            { name: 'Pilot (Beta)', color: 'orange' },
            { name: 'Deployment', color: 'green' },
            { name: 'Completion / Sustainment', color: 'teal' },
            { name: 'End of Life', color: 'red' }
          ]
        }
      });

      return response.data.data.gid;
    } catch (error) {
      console.error('Error creating project stage field:', error);
      return null;
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

// Project Stage Management
const STAGE_FIELD_NAMES = ['T&I Stage', 'Project Stage', 'Stage', 'Dashboard Stage'];

export function getProjectStage(project: AsanaProject): string {
  // Look for custom field that tracks project stage (check multiple possible names)
  const stageField = project.custom_fields.find(field => 
    STAGE_FIELD_NAMES.includes(field.name)
  );

  if (stageField && stageField.display_value) {
    // Map display values to column IDs (supports both old and new naming)
    const stageMap: Record<string, string> = {
      // Current T&I Portfolio values
      'Backlog': 'backlog',
      'Definition': 'definition', 
      'Development': 'development',
      'Testing': 'testing',
      'Testing (Alpha)': 'testing',
      'Alpha': 'testing',
      'Pilot': 'pilot',
      'Pilot (Beta)': 'pilot',
      'Beta': 'pilot',
      'Deployment': 'deployment',
      'Deploy': 'deployment',
      'Deploy / Sustain': 'completion',  // Actual value from T&I Portfolio
      'Completion / Sustainment': 'completion',
      'Completion': 'completion',
      'Sustainment': 'completion',
      'End of Life': 'eol',
      'EOL': 'eol'
    };

    return stageMap[stageField.display_value] || 'backlog';
  }

  // Fallback: use status color to determine stage
  const statusColor = getStatusColor(project);
  if (project.completed) return 'completion';
  if (statusColor === 'green') return 'development';
  if (statusColor === 'yellow') return 'testing';
  if (statusColor === 'red') return 'backlog';
  
  return 'backlog';
}

export async function updateProjectStage(projectId: string, stage: string): Promise<void> {
  try {
    // For now, just log the update instead of making API calls
    // This prevents errors while we test the UI
    console.log(`Would update project ${projectId} to stage: ${stage}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // TODO: Implement actual API call once we test the custom field setup
    
  } catch (error) {
    console.error('Error updating project stage:', error);
    throw error;
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