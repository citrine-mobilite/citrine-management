export type EmployeeRoleType =
  | 'employé'
  | 'gestionnaire de projet'
  | 'stagiaire'
  | 'gestionnaire de projet assistant'
  | 'sponsor'
  | 'informaticien'
  | 'comptable'
  | 'rh'
  | 'finance'
  | 'Super Administrateur';

export type EmployeeStatus =
  | 'en_poste'
  | 'en_conge'
  | 'en_permission'
  | 'en_mission'
  | 'maladie'
  | 'suspendu'
  | 'demissionne'
  | 'renvoye'
  | 'parti';

export interface Employee {
  /** Clé primaire auto-incrémentée (BIGSERIAL en base de données, représentée en string pour compatibilité React) */
  id: string;
  doc_id?: string;
  /** Identifiant universel unique UUID v4 (gen_random_uuid()) */
  uid?: string;
  /** Identifiant numérique brut BIGINT PostgreSQL */
  _dbId?: number;
  /** Clé étrangère vers la table users (BIGINT en BD) */
  userId?: string | number;
  /** Clé étrangère vers la table roles (BIGINT en BD) */
  roleId?: string | number;
  /** Clé étrangère vers le manager dans la table employees (BIGINT en BD) */
  managerId?: string | number;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  avatarUrl: string;
  roleType: EmployeeRoleType | string;
  role?: string;
  department?: string;
  position?: string;
  /** Statut actif/inactif booléen en BD ou statut textuel */
  status?: EmployeeStatus | boolean;
  /** Statut RH contractuel textuel : en_poste, en_conge, suspendu, etc. */
  employmentStatus?: EmployeeStatus;
  hireDate?: string;
  departureDate?: string;
  departureReason?: string;
  suspensionDate?: string;
  suspensionReason?: string;
  birthDate?: string;
  salary?: number;
  team?: string;
  createdAt?: string;
  updatedAt?: string;
  statusReason?: string;
  statusStartDate?: string;
  statusEndDate?: string;
  missionHistory?: Array<{
    id: string;
    reason: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    createdAt: string;
  }>;
}
