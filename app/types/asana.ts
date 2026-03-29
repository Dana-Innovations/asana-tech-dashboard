export interface AsanaProject {
  gid: string;
  name: string;
  completed: boolean;
  current_status?: {
    color: 'green' | 'yellow' | 'red';
    text: string;
    title: string;
    created_at?: string;
  };
  custom_fields: AsanaCustomField[];
  team?: {
    gid: string;
    name: string;
  };
  members: AsanaMember[];
  created_at: string;
  modified_at: string;
  due_date?: string;
  notes?: string;
  progress?: {
    completed_tasks: number;
    total_tasks: number;
    percentage: number;
  };
}

export interface AsanaCustomField {
  gid: string;
  name: string;
  type: 'text' | 'number' | 'enum' | 'multi_enum' | 'date';
  display_value: string;
  enum_options?: Array<{
    gid: string;
    name: string;
    color: string;
  }>;
}

export interface AsanaMember {
  gid: string;
  name: string;
  email: string;
  photo?: {
    image_128x128: string;
  };
}

export interface AsanaTask {
  gid: string;
  name: string;
  completed: boolean;
  assignee?: AsanaMember;
  due_date?: string;
  created_at: string;
  modified_at: string;
}

export interface DashboardFilter {
  status?: ('green' | 'yellow' | 'red')[];
  assignee?: string[];
  search?: string;
  projectType?: string[];
  department?: string[];
  tiPriority?: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: DashboardFilter;
  createdAt: Date;
}

export interface KanbanColumn {
  id: string;
  title: string;
  projects: AsanaProject[];
  color: string;
}

export type ViewMode = 'kanban' | 'stoplight';
export type SortField = 'name' | 'modified_at' | 'due_date' | 'progress';
export type SortOrder = 'asc' | 'desc';