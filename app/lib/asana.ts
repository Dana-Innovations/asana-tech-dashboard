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
            'custom_fields.people_value.gid',
            'custom_fields.people_value.name',
            'custom_fields.people_value.email',
            'custom_fields.people_value.photo.image_128x128',
            'custom_fields.enum_options.gid',
            'custom_fields.enum_options.name',
            'custom_fields.enum_options.color',
            'team.gid',
            'team.name',
            'owner.gid',
            'owner.name',
            'owner.email',
            'owner.photo.image_128x128',
            'created_at',
            'modified_at',
            'due_date',
            'notes'
          ].join(',')
        }
      });

      const projects = response.data.data;
      
      // Process projects and extract deduplicated team members from Owner + Project Participants only
      const projectsWithBasicData: AsanaProject[] = projects.map((project: any) => {
        const members: any[] = [];
        const memberGids = new Set<string>();

        // Add owner if exists
        if (project.owner) {
          members.push(project.owner);
          memberGids.add(project.owner.gid);
        }

        // Add project participants from custom field (avoiding duplicates by GID)
        const participantsField = project.custom_fields?.find((field: any) => 
          field.name === 'Project Participants'
        );
        
        if (participantsField && participantsField.people_value) {
          participantsField.people_value.forEach((participant: any) => {
            if (!memberGids.has(participant.gid)) {
              members.push(participant);
              memberGids.add(participant.gid);
            }
          });
        }

        return {
          ...project,
          custom_fields: project.custom_fields || [],
          members: members,
          progress: { completed_tasks: 0, total_tasks: 0, percentage: 0 } // Default progress
        };
      });

      return projectsWithBasicData;
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
    // Map display values to column IDs (matching actual Asana enum values)
    const stageMap: Record<string, string> = {
      'Backlog': 'backlog',
      'Definition': 'definition', 
      'Development': 'development',
      'Testing (ALPHA)': 'testing',
      'Testing / Pilot (BETA)': 'pilot',
      'Deployment': 'deployment',
      'Deploy / Sustain': 'completion',
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
    const token = process.env.NEXT_PUBLIC_ASANA_TOKEN;
    if (!token) {
      throw new Error('No Asana token available');
    }

    // Map UI stages to T&I Stage field values (matching actual Asana enum values)
    const stageMapping: { [key: string]: string } = {
      'backlog': 'Backlog',
      'definition': 'Definition', 
      'development': 'Development',
      'testing': 'Testing (ALPHA)',
      'pilot': 'Testing / Pilot (BETA)',
      'deployment': 'Deploy / Sustain',
      'completion': 'Deploy / Sustain',
      'eol': 'EOL'
    };

    const tiStageValue = stageMapping[stage];
    if (!tiStageValue) {
      throw new Error(`Unknown stage: ${stage}`);
    }

    // First, get the project to find the T&I Stage custom field ID
    const projectResponse = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}?opt_fields=custom_fields.gid,custom_fields.name,custom_fields.enum_options.gid,custom_fields.enum_options.name`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!projectResponse.ok) {
      throw new Error(`Failed to get project: ${projectResponse.statusText}`);
    }

    const project = await projectResponse.json();
    
    // Find the T&I Stage custom field
    const tiStageField = project.data.custom_fields?.find((field: any) => 
      field.name === 'T&I Stage' || field.name === 'TI Stage'
    );

    if (!tiStageField) {
      throw new Error('T&I Stage custom field not found on project');
    }

    // Find the enum option for the stage value
    const enumOption = tiStageField.enum_options?.find((option: any) => 
      option.name === tiStageValue
    );

    if (!enumOption) {
      throw new Error(`Stage value '${tiStageValue}' not found in T&I Stage field options`);
    }

    // Update the project's custom field
    const updateResponse = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          custom_fields: {
            [tiStageField.gid]: enumOption.gid
          }
        }
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      throw new Error(`Failed to update project stage: ${updateResponse.statusText} - ${errorData}`);
    }

    console.log(`Successfully updated project ${projectId} to T&I Stage: ${tiStageValue}`);
    
  } catch (error) {
    console.error('Error updating project stage:', error);
    throw error;
  }
}

export async function updateProjectCustomField(projectId: string, fieldId: string, value: any): Promise<void> {
  try {
    const token = process.env.NEXT_PUBLIC_ASANA_TOKEN;
    if (!token) {
      throw new Error('No Asana token available');
    }

    const response = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          custom_fields: {
            [fieldId]: value
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update custom field: ${response.statusText} - ${errorData}`);
    }
  } catch (error) {
    console.error('Error updating project custom field:', error);
    throw error;
  }
}

export async function updateProjectStatus(projectId: string, statusType: 'on_track' | 'at_risk' | 'off_track', statusText: string = 'Status updated via TI Dashboard'): Promise<void> {
  try {
    const token = process.env.NEXT_PUBLIC_ASANA_TOKEN;
    if (!token) {
      throw new Error('No Asana token available');
    }

    const response = await fetch(`https://app.asana.com/api/1.0/status_updates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          parent: projectId,
          status_type: statusType,
          text: statusText
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update project status: ${response.statusText} - ${errorData}`);
    }
  } catch (error) {
    console.error('Error updating project status:', error);
    throw error;
  }
}

export async function updateProjectDueDate(projectId: string, dueDate: string | null): Promise<void> {
  try {
    const token = process.env.NEXT_PUBLIC_ASANA_TOKEN;
    if (!token) {
      throw new Error('No Asana token available');
    }

    const response = await fetch(`https://app.asana.com/api/1.0/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          due_on: dueDate
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update project due date: ${response.statusText} - ${errorData}`);
    }
  } catch (error) {
    console.error('Error updating project due date:', error);
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

export function getProjectPriority(project: AsanaProject): string | null {
  const tiPriorityField = project.custom_fields.find(field => field.name === 'T&I Priority');
  return tiPriorityField?.display_value || null;
}

export function getPriorityBadgeClasses(priority: string | null): string {
  switch (priority) {
    case 'P1':
      return 'bg-red-600 text-white';
    case 'P2':
      return 'bg-orange-500 text-white';
    case 'P3':
      return 'bg-amber-400 text-gray-900';
    case 'P4':
      return 'bg-blue-400 text-white';
    case 'P5':
      return 'bg-gray-400 text-white';
    default:
      return '';
  }
}