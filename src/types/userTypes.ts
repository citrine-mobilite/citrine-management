export type Role = 'Administrateur' | 'Employé' | 'Responsable';
export type UserRole = 'administrateur' | 'responsable' | 'employé';
export type UserStatus = 'actif' | 'inactif';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  authMethod?: 'google' | 'password';
  passwordHash?: string;
  avatarUrl?: string;
  department?: string;
  phone?: string;
  employeeId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ConnectionLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  ipAddress?: string;
  location?: string;
  authMethod: 'google' | 'password';
  status: 'success' | 'failed';
  userAgent?: string;
  details?: string;
}
