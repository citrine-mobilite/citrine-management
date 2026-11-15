export type MilestoneStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type ProjectStatus = 'active' | 'on_hold' | 'completed';

export interface ProjectMilestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  targetDate?: string;
  ownerId?: string;
  ownerName?: string;
  order: number;
  completedAt?: string;
}

export interface StrategicProject {
  id: string;
  docId?: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  milestones: ProjectMilestone[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
