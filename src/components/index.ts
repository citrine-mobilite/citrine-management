/**
 * 📦 CITRINE MANAGEMENT - CENTRAL COMPONENT REGISTRY & BARREL EXPORTS
 * Clean Architecture & Domain-Driven Modular Organization
 */

// 👥 Employee & HR
export { default as EmployeePortal } from './EmployeePortal';
export { default as CollaboratorPanel } from './CollaboratorPanel';
export { default as ProfilePage } from './ProfilePage';
export { default as DisciplinaryPanel } from './DisciplinaryPanel';
export { default as RhReportModal } from './RhReportModal';
export { default as FrenchTimePicker } from './employee/FrenchTimePicker';
export { default as EmployeeSalaryTab } from './employee/EmployeeSalaryTab';
export { default as EmployeeLoansTab } from './employee/EmployeeLoansTab';
export { default as EmployeePayslipModal } from './employee/EmployeePayslipModal';

// ⏱️ Presence & Geolocation Clocking
export { default as PresencePanel } from './PresencePanel';
export { PointageMap } from './PointageMap';
export { CollaboratorPresenceMap } from './CollaboratorPresenceMap';
export { PresenceStatisticsView } from './PresenceStatisticsView';
export { default as PresenceRequestsView } from './PresenceRequestsView';
export { default as KioskClockingModal } from './KioskClockingModal';
export { default as OfficeQRCodeModal } from './OfficeQRCodeModal';
export { default as Badge16CodeManager } from './Badge16CodeManager';
export { default as DynamicQrManagerModal } from './presence/DynamicQrManagerModal';
export { default as AdminOnBehalfClockModal } from './presence/AdminOnBehalfClockModal';

// 📋 Operations, Tasks & Inventory
export { default as TaskPanel } from './TaskPanel';
export { default as ReminderPanel } from './ReminderPanel';
export { default as InventoryPanel } from './InventoryPanel';
export { default as PartnersPanel } from './PartnersPanel';

// 💰 Finance
export { default as FinancePanel } from './FinancePanel';

// 📞 Communication & VoIP Calls
export { default as CommunicationPanel } from './CommunicationPanel';
export { default as NotificationConsole } from './NotificationConsole';
export { TeamCallsPanel } from './TeamCallsPanel';
export { ActiveCallModal } from './ActiveCallModal';
export { IncomingCallModal } from './IncomingCallModal';

// 📄 Documents & Templates
export { default as DocumentGeneratorPanel } from './DocumentGeneratorPanel';
export { default as DocumentPreview } from './DocumentPreview';
export * from './DocTemplates';

// ⚙️ Administration & Governance
export { default as CompanySettingsPanel } from './CompanySettingsPanel';
export { default as UserManagementPanel } from './UserManagementPanel';
export { default as AdminDashboardOverview } from './AdminDashboardOverview';

// 🎨 Shell, Layout & Common UI
export { default as Sidebar } from './Sidebar';
export type { TabType } from './Sidebar';
export { default as LoginModal } from './LoginModal';
export { default as ProfileModal } from './ProfileModal';
export { default as ToastContainer } from './Toast';
export type { ToastMessage } from './Toast';
export { default as ErrorBoundary } from './ErrorBoundary';
export { default as OfflineStatusBanner } from './OfflineStatusBanner';
export { default as PullToRefreshContainer } from './PullToRefreshContainer';
export { default as SwipeableListItem } from './SwipeableListItem';
export { default as ModuleSkeletonLoader } from './ModuleSkeletonLoader';
export { CMLogo } from './CMLogo';
export { PWAInstallButton } from './PWAInstallPrompt';
export { PushNotificationManagerModal } from './PushNotificationManagerModal';
export { SearchableSelect } from './common/SearchableSelect';
export type { SelectOption, SearchableSelectProps } from './common/SearchableSelect';
