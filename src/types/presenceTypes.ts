export type PresenceStatus = 'present' | 'late' | 'absent' | 'mission' | 'not_tracked';

export type EmergencyType =
  | 'retard'
  | 'sortie_professionnelle'
  | 'retour_sortie_professionnelle'
  | 'depart_anticipe'
  | 'permission'
  | 'pause_anticipee'
  | 'rallonge_pause'
  | 'sortie_prematuree'
  | 'autre';

export type IncidentType =
  | 'retard'
  | 'sortie_professionnelle'
  | 'retour_sortie_professionnelle'
  | 'sortie_prematuree'
  | 'depart_anticipe'
  | 'permission'
  | 'pause_anticipee'
  | 'rallonge_pause'
  | 'pause_prolongee'
  | 'absence_injustifiee'
  | 'depart_sans_validation'
  | 'absence_non_autorisee'
  | 'autre';

export type IncidentOrigin = 'signale_par_employe' | 'automatique_pointage' | 'signale_par_responsable';

export interface AttendanceIncident {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  timeString: string; // HH:mm
  type: IncidentType;
  origin: IncidentOrigin;
  reason: string;
  description?: string;
  isDeclaredInAdvance: boolean;
  isJustified: boolean;
  status: 'signale' | 'automatique' | 'justifie' | 'injustifie';
  createdAt: string;
  adminComment?: string;
}

export interface EmergencyDeclaration {
  id: string;
  type: EmergencyType;
  reason: string;
  timestamp: string;
  timeString: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export type ClockingMethod =
  | 'qr_code'
  | 'qr_code_door'
  | 'qr_code_dynamic'
  | 'badge_code_16'
  | 'admin_on_behalf'
  | 'alpha_numeric_code'
  | 'gps'
  | 'wifi_ip'
  | 'site_declaration'
  | 'manual_admin'
  | 'kiosk_pin';

export interface BadgeSecurityCode16 {
  id: string;
  code: string;
  formattedCode: string;
  generatedBy: string;
  createdAt: string;
  expiresAt?: string;
  targetMonth: string;
  isUsed: boolean;
  usedByEmployeeId?: string;
  usedByEmployeeName?: string;
  usedAt?: string;
  usedMonth?: string;
  usedLatitude?: number;
  usedLongitude?: number;
  notes?: string;
}

export interface DynamicQrSession {
  id: string;
  sessionId: string;
  token: string;
  generatedBy: string;
  managerId?: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used' | 'expired';
  usedByEmployeeId?: string;
  usedByEmployeeName?: string;
  usedAt?: string;
  action?: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure';
}

export interface Presence {
  id: string;
  employeeId: string;
  date: string;
  arrivalTime: string | null;
  pauseStart: string | null;
  pauseEnd: string | null;
  departureTime: string | null;
  sortieProStart?: string | null;
  sortieProEnd?: string | null;
  sortieProReason?: string | null;
  status: PresenceStatus;
  correctionReason?: string | null;
  correctionReasonStatus?: 'pending' | 'approved' | 'rejected' | null;
  departureReason?: string | null;
  departureReasonStatus?: 'pending' | 'approved' | 'rejected' | null;
  emergencies?: EmergencyDeclaration[];
  location?: string;
  latitude?: number;
  longitude?: number;
  clockingMethod?: ClockingMethod;
  siteName?: string;
  qrCodeToken?: string;
  ipAddress?: string;
  deviceId?: string;
  badgedByAdminId?: string;
  badgedByAdminName?: string;
  adminBadgeReason?: string;
  dynamicQrSessionId?: string;
  clockLocations?: {
    arrival?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
    pauseStart?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
    pauseEnd?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
    departure?: { latitude: number; longitude: number; zoneName: string; time: string; method?: ClockingMethod; siteName?: string };
  };
  updatedAt?: string;
  employeeName?: string;
}
