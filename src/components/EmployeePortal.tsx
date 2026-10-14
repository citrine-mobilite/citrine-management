import React, { useEffect } from 'react';
import { Clock, Calendar, DollarSign, CreditCard, CheckSquare, AlertTriangle, Bell, User, Smartphone, CalendarDays } from 'lucide-react';
import { 
  AppUser, 
  Employee, 
  Presence, 
  Task, 
  SalaryPayment, 
  FinancialTransaction,
  EmployeeSalaryDebt,
  NotificationLog,
  CompanyModuleConfig,
  AttendanceIncident,
  LeaveRequest 
} from '../types';
import OfficeQRCodeModal from './OfficeQRCodeModal';
import RhReportModal from './RhReportModal';
import { useEmployeePortalLogic } from './employee/useEmployeePortalLogic';
import { appBadgeService } from '../utils/appBadgeService';

// Subcomponents (< 300 lines each)
import { EmployeeHeroBanner } from './employee/EmployeeHeroBanner';
import { EmployeeDailyClockingWidget } from './employee/EmployeeDailyClockingWidget';
import { EmployeePresencesHistorySection } from './employee/EmployeePresencesHistorySection';
import { EmployeeIncidentsTab } from './employee/EmployeeIncidentsTab';
import { EmployeeLeaveTab } from './employee/EmployeeLeaveTab';
import EmployeeSalaryTab from './employee/EmployeeSalaryTab';
import EmployeeLoansTab from './employee/EmployeeLoansTab';
import { EmployeeAssignedTasksSection } from './employee/EmployeeAssignedTasksSection';
import TaskPanel from './TaskPanel';
import { EmployeePointageModal } from './employee/EmployeePointageModal';
import { EmployeeCustomTimeModal } from './employee/EmployeeCustomTimeModal';
import { EmployeeEmergencyDeclarationModal } from './employee/EmployeeEmergencyDeclarationModal';
import { EmployeeLoanRequestModal } from './employee/EmployeeLoanRequestModal';
import EmployeePayslipModal from './employee/EmployeePayslipModal';
import { EmployeeAlertsTab } from './employee/EmployeeAlertsTab';
import ProfilePage from './ProfilePage';

interface EmployeePortalProps {
  currentUser: AppUser | null;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  salaryPayments: SalaryPayment[];
  financialTransactions: FinancialTransaction[];
  salaryDebts?: EmployeeSalaryDebt[];
  onUpdatePresences: (updated: Presence[]) => void;
  onUpdateTasks: (updated: Task[]) => void;
  onAddNotification: (log: NotificationLog) => void;
  currentTime: string;
  onOpenProfileModal?: () => void;
  moduleConfig?: CompanyModuleConfig;
  attendanceIncidents?: AttendanceIncident[];
  onAddAttendanceIncident?: (incident: AttendanceIncident) => void;
  notifications?: NotificationLog[];
  onUpdateNotifications?: (logs: NotificationLog[]) => void;
  leaveRequests?: LeaveRequest[];
  initialSubTab?: string;
  onUpdateUser?: (updated: AppUser) => void;
  onLogout?: () => void;
  showToast?: (titleOrMessage: string, descOrType?: any, type?: any) => void;
}

const formatXAF = (amount: number = 0) => {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
};

export default function EmployeePortal(props: EmployeePortalProps) {
  const {
    currentUser,
    tasks,
    salaryPayments,
    salaryDebts = [],
    onUpdateTasks,
    onAddNotification,
    onOpenProfileModal,
    moduleConfig,
  } = props;

  const logic = useEmployeePortalLogic(props);

  const isAssignedToMe = (t: Task) => {
    const assignedField = (t.assignedTo || '').toLowerCase();
    const myName = (logic.employeeProfile.name || '').toLowerCase();
    const myId = (logic.employeeProfile.id || '').toLowerCase();
    const myEmail = (logic.employeeProfile.email || '').toLowerCase();
    const currentName = (currentUser?.name || '').toLowerCase();
    const currentId = (currentUser?.id || '').toLowerCase();
    if (assignedField.includes('équipe') || assignedField.includes('equipe') || assignedField.includes('tous')) return true;
    const parts = assignedField.split(',').map((p) => p.trim());
    return parts.some((p) => 
      (myName && p === myName) ||
      (myId && p === myId) ||
      (myEmail && p === myEmail) ||
      (currentName && p === currentName) ||
      (currentId && p === currentId)
    ) || (t.employeeId && (t.employeeId === logic.employeeProfile.id || t.employeeId === currentUser?.id));
  };

  const pendingTasksCount = tasks.filter(t => isAssignedToMe(t) && t.status !== 'completed').length;
  const totalBadgeCount = (logic.unreadAlertsCount || 0) + pendingTasksCount;

  useEffect(() => {
    appBadgeService.updateBadge(totalBadgeCount);
  }, [totalBadgeCount]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Hero Profile Banner with Hero palette and Dual-Role display */}
      <EmployeeHeroBanner
        employeeProfile={logic.employeeProfile}
        currentUser={currentUser}
        todayPresence={logic.todayPresence}
        onOpenProfileModal={onOpenProfileModal}
        calculateTenure={logic.calculateTenure}
      />

      {/* Subtab navigation */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
        {[
          { id: 'clocking', label: 'Pointage Direct', icon: Clock, badge: undefined },
          { id: 'presences', label: 'Mes Pointages', icon: Calendar, badge: undefined },
          { id: 'leaves', label: 'Mes Congés & Permissions', icon: CalendarDays, badge: (props.leaveRequests || []).filter(l => (l.employeeId === logic.employeeProfile.id || l.employeeEmail === logic.employeeProfile.email) && l.status === 'pending').length || undefined },
          { id: 'incidents', label: 'Signalements', icon: AlertTriangle, badge: logic.myIncidents.length },
          { id: 'tasks', label: 'Mes Tâches', icon: CheckSquare, badge: pendingTasksCount || undefined },
          { id: 'alerts', label: 'Mes Alertes', icon: Bell, badge: logic.unreadAlertsCount > 0 ? logic.unreadAlertsCount : undefined },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = logic.activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => logic.setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer active:scale-98 ${
                isActive
                  ? 'bg-[#2A7B76] text-white shadow-xs ring-2 ring-emerald-200/50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <TabIcon className={`h-4 w-4 ${isActive ? 'text-emerald-200' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-white text-[#2A7B76]'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Sections */}
      {logic.activeTab === 'clocking' && (
        <EmployeeDailyClockingWidget
          currentUser={currentUser}
          employeeProfile={logic.employeeProfile}
          todayPresence={logic.todayPresence}
          todayStr={logic.todayStr}
          currentDateStr={logic.currentDateStr}
          liveTimeString={logic.liveTimeString}
          isLocating={logic.isLocating}
          sensorsDiagnostic={logic.sensorsDiagnostic}
          runSensorsDiagnostic={logic.runSensorsDiagnostic}
          setShowOfficeQRModal={logic.setShowOfficeQRModal}
          setShowClockingModal={logic.setShowClockingModal}
          setPendingClockAction={logic.setPendingClockAction}
          setSelectedClockMethod={logic.setSelectedClockMethod}
          setQrCodeError={logic.setQrCodeError}
          startCameraScan={logic.startCameraScan}
          setEmergencyType={logic.setEmergencyType}
          setEmergencyReason={logic.setEmergencyReason}
          setShowEmergencyModal={logic.setShowEmergencyModal}
          setCustomClockReason={logic.setCustomClockReason}
          setCustomClockError={logic.setCustomClockError}
          setShowCustomClockModal={logic.setShowCustomClockModal}
          moduleConfig={props.moduleConfig}
        />
      )}

      {logic.activeTab === 'presences' && (
        <EmployeePresencesHistorySection
          myPresences={logic.myPresences}
          displayedPresences={logic.displayedPresences}
          employeeClockingStats={logic.employeeClockingStats}
          portalReportMonth={logic.portalReportMonth}
          setPortalReportMonth={logic.setPortalReportMonth}
          handleGeneratePortalReport={logic.handleGeneratePortalReport}
          isGeneratingReport={logic.isGeneratingReport}
          paginationMode={logic.paginationMode}
          setPaginationMode={logic.setPaginationMode}
          pageSize={logic.pageSize}
          setPageSize={logic.setPageSize}
          presencePage={logic.presencePage}
          setPresencePage={logic.setPresencePage}
          totalPages={logic.totalPages}
          infiniteCount={logic.infiniteCount}
          setInfiniteCount={logic.setInfiniteCount}
        />
      )}

      {logic.activeTab === 'incidents' && (
        <EmployeeIncidentsTab
          employeeProfile={logic.employeeProfile}
          myIncidents={logic.myIncidents}
          onOpenDeclareIncidentModal={() => logic.setShowEmergencyModal(true)}
        />
      )}

      {logic.activeTab === 'leaves' && (
        <EmployeeLeaveTab
          employeeProfile={logic.employeeProfile}
          currentUser={currentUser}
          leaveRequests={props.leaveRequests || []}
          onAddNotification={onAddNotification}
          showToast={logic.showToast}
        />
      )}

      {logic.activeTab === 'tasks' && (
        <TaskPanel
          tasks={tasks}
          onUpdateTasks={onUpdateTasks}
          onAddNotification={onAddNotification}
          currentRole="employé"
          employees={props.employees}
          currentUser={currentUser}
          showToast={(msg, type) => logic.showToast('Tâches', msg, type === 'error' ? 'warning' : 'success')}
        />
      )}

      {logic.activeTab === 'alerts' && (
        <EmployeeAlertsTab
          employeeProfile={logic.employeeProfile}
          currentUser={currentUser}
          tasks={tasks}
          onUpdateTasks={onUpdateTasks}
          employees={props.employees}
          incidents={props.attendanceIncidents || []}
          notifications={props.notifications || []}
          presences={props.presences || []}
          onAddNotification={onAddNotification}
          onUpdateNotifications={props.onUpdateNotifications}
        />
      )}

      {/* Modals */}
      <EmployeePointageModal
        showClockingModal={logic.showClockingModal}
        setShowClockingModal={logic.setShowClockingModal}
        pendingClockAction={logic.pendingClockAction}
        selectedClockMethod={logic.selectedClockMethod}
        setSelectedClockMethod={logic.setSelectedClockMethod}
        qrCodeError={logic.qrCodeError}
        setQrCodeError={logic.setQrCodeError}
        videoRef={logic.videoRef}
        stopCameraScan={logic.stopCameraScan}
        startCameraScan={logic.startCameraScan}
        isLocating={logic.isLocating}
        employeeProfile={logic.employeeProfile}
        onConfirmClocking={logic.handleConfirmClocking}
        showToast={logic.showToast}
        moduleConfig={moduleConfig}
      />

      <EmployeeCustomTimeModal
        show={logic.showCustomClockModal}
        onClose={() => logic.setShowCustomClockModal(false)}
        clockFieldToEdit="arrival"
        setClockFieldToEdit={() => {}}
        customTimeValue={`${logic.customClockHour}:${logic.customClockMinute}`}
        setCustomTimeValue={(val) => {
          const parts = val.split(':');
          if (parts.length === 2) {
            logic.setCustomClockHour(parts[0]);
            logic.setCustomClockMinute(parts[1]);
          }
        }}
        customClockReason={logic.customClockReason}
        setCustomClockReason={logic.setCustomClockReason}
        customClockError={logic.customClockError}
        moduleConfig={moduleConfig}
        onSubmit={logic.handleConfirmCustomClock}
      />

      <EmployeeEmergencyDeclarationModal
        show={logic.showEmergencyModal}
        onClose={() => logic.setShowEmergencyModal(false)}
        emergencyType={logic.emergencyType}
        setEmergencyType={logic.setEmergencyType}
        emergencyReason={logic.emergencyReason}
        setEmergencyReason={logic.setEmergencyReason}
        onSubmit={logic.handleConfirmEmergency}
        isSubmitting={logic.isSubmittingEmergency}
      />

      <EmployeeLoanRequestModal
        show={logic.showLoanModal}
        onClose={() => logic.setShowLoanModal(false)}
        loanSuccess={false}
        loanAmount=""
        setLoanAmount={() => {}}
        loanReason=""
        setLoanReason={() => {}}
        onSubmit={(e) => {
          e.preventDefault();
          logic.setShowLoanModal(false);
          logic.showToast('Demande Envoyée', 'Votre demande de prêt a été transmise pour validation.', 'success');
        }}
      />

      {logic.selectedPayslip && (
        <EmployeePayslipModal
          selectedPayslip={logic.selectedPayslip}
          employeeProfile={logic.employeeProfile}
          onClose={() => logic.setSelectedPayslip(null)}
          formatXAF={formatXAF}
        />
      )}

      {logic.showOfficeQRModal && (
        <OfficeQRCodeModal
          isOpen={logic.showOfficeQRModal}
          onClose={() => logic.setShowOfficeQRModal(false)}
          qrSecret={moduleConfig?.doorQrCodeToken || moduleConfig?.qrCodeSecret || 'CITRINE_DOOR_HQ_MAIN_2026'}
          companyName={moduleConfig?.companyName || 'Citrine Entreprise SARL'}
        />
      )}

      {logic.certifiedReport && (
        <RhReportModal
          isOpen={Boolean(logic.certifiedReport)}
          report={logic.certifiedReport}
          selectedMonth={logic.portalReportMonth}
          onMonthChange={logic.handleGeneratePortalReport}
          onClose={() => logic.setCertifiedReport(null)}
        />
      )}
    </div>
  );
}
