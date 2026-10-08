export type EmployeeRoleType =
  | 'employé'
  | 'gestionnaire de projet'
  | 'stagiaire'
  | 'gestionnaire de projet assistant'
  | 'sponsor'
  | 'informaticien'
  | 'comptable'
  | 'rh'
  | 'finance';

export type EmployeeStatus = 'en_poste' | 'en_conge' | 'parti' | 'renvoye' | 'suspendu' | 'maladie';

export interface Employee {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  avatarUrl: string;
  roleType: EmployeeRoleType;
  role?: string;
  department?: string;
  status?: EmployeeStatus;
  hireDate?: string;
  departureDate?: string;
  departureReason?: string;
  suspensionDate?: string;
  suspensionReason?: string;
  birthDate?: string;
  salary?: number;
  userId?: string;
  managerId?: string;
  team?: string;
}
