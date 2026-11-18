export interface CompanyModuleConfig {
  enablePresences?: boolean;
  enableCollaborators?: boolean;
  enableTasks?: boolean;
  enableStrategicProjects?: boolean;
  enableReminders?: boolean;
  enableFinances: boolean;
  enableDocuments: boolean;
  enableCommunications: boolean;
  enableLogs: boolean;
  enableInventory: boolean;
  enablePartners: boolean;
  enableDiscipline?: boolean;
  enableOrgChart?: boolean;
  enableStatistics?: boolean;
  enableTeamCalls?: boolean;
  enableCalls?: boolean;
  enableBreakTracking?: boolean;
  plannedDepartureTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  departureActiveStartTime?: string;
  companyName?: string;
  companyLatitude?: number;
  companyLongitude?: number;
  qrCodeSecret: string;
  doorQrCodeToken?: string;
  doorQrCodeRevoked?: boolean;
  revokedDoorTokens?: string[];
  doorQrCodeGeneratedAt?: string;
  doorQrSiteName?: string;
  doorQrRequireGps?: boolean;
  doorQrPosterTitle?: string;
  officeWifiSsid?: string;
  allowedOfficeIPs: string[];
  siteLocations: Array<{ name: string; address: string; lat: number; lng: number }> | any[];
  hqName?: string;
  hqAddress?: string;
  hqLatitude?: number;
  hqLongitude?: number;
  workStartTime?: string;
  lateThresholdTime?: string;
  defaultSalary?: number;
  kioskPin?: string;
  companyLogoBase64?: string;
  companyLogoUrl?: string;
  companyLegalForm?: string;
  companyBaseline?: string;
  companyNui?: string;
  companyRccm?: string;
  companyCapital?: string;
  companyCity?: string;
  companyCountry?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  enableRecruitment?: boolean;
  enableExpenseClaims?: boolean;
  enableHse?: boolean;
  enableVisitors?: boolean;
  enableIdeasSurveys?: boolean;
  enableEmailNotifications?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSenderName?: string;
  hrNotificationEmail?: string;
}

export const DEFAULT_MODULE_CONFIG: CompanyModuleConfig = {
  enablePresences: true,
  enableCollaborators: true,
  enableTasks: true,
  enableStrategicProjects: true,
  enableReminders: true,
  enableFinances: true,
  enableDocuments: true,
  enableCommunications: true,
  enableLogs: true,
  enableInventory: true,
  enablePartners: true,
  enableDiscipline: true,
  enableOrgChart: true,
  enableStatistics: true,
  enableTeamCalls: true,
  enableCalls: true,
  enableBreakTracking: true,
  enableRecruitment: true,
  enableExpenseClaims: true,
  enableHse: true,
  enableVisitors: true,
  enableIdeasSurveys: true,
  plannedDepartureTime: '16:30',
  breakStartTime: '12:00',
  breakEndTime: '15:00',
  departureActiveStartTime: '16:00',
  companyName: 'Citrine SARL',
  companyLatitude: 4.016246,
  companyLongitude: 9.8203514,
  qrCodeSecret: '',
  doorQrCodeToken: '',
  doorQrCodeGeneratedAt: '',
  doorQrSiteName: 'Entrée Principale (HQ Siège)',
  doorQrRequireGps: false,
  doorQrPosterTitle: 'BORNE OFFICIELLE DE POINTAGE',
  officeWifiSsid: '',
  allowedOfficeIPs: [],
  siteLocations: [],
  hqName: 'Siège Citrine - Japoma Carrefour Matango',
  hqAddress: 'Japoma (Carrefour Matango), Douala',
  hqLatitude: 4.016246,
  hqLongitude: 9.8203514,
  workStartTime: '08:00',
  lateThresholdTime: '08:30',
  defaultSalary: 200000,
  companyLogoUrl: '/citrine-logo.png',
  companyLegalForm: 'Société à Responsabilité Limitée (SARL)',
  companyBaseline: 'Innovating · Prospering | Improving · Inspiring',
  companyNui: 'M012618579246S',
  companyRccm: 'CM-DLA-01-2026-B13-00011',
  companyCapital: '10 000 000 FRANCS CFA',
  companyCity: 'Douala',
  companyCountry: 'Cameroun',
  companyPhone: '+237 680 59 40 77',
  companyEmail: 'info@citrine-mobilite.com',
  companyWebsite: 'https://citrine-mobilite.com',
  enableEmailNotifications: true,
  smtpHost: '',
  smtpPort: 465,
  smtpSecure: true,
  smtpUser: '',
  smtpPass: '',
  smtpFrom: 'Citrine SARL RH <info@citrine-mobilite.com>',
  hrNotificationEmail: 'info@citrine-mobilite.com',
};
