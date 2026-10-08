import React from 'react';
import { Clock, Calendar, DollarSign, CreditCard, CheckSquare, AlertTriangle, Bell, User } from 'lucide-react';
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
  AttendanceIncident 
} from '../types';
import OfficeQRCodeModal from './OfficeQRCodeModal';
import RhReportModal from './RhReportModal';
import { useEmployeePortalLogic } from './employee/useEmployeePortalLogic';

// Subcomponents (< 300 lines each)
import { EmployeeHeroBanner } from './employee/EmployeeHeroBanner';
import { EmployeeDailyClockingWidget } from './employee/EmployeeDailyClockingWidget';
import { EmployeePresencesHistorySection } from './employee/EmployeePresencesHistorySection';
import { EmployeeIncidentsTab } from './employee/EmployeeIncidentsTab';
import EmployeeSalaryTab from './employee/EmployeeSalaryTab';
import EmployeeLoansTab from './employee/EmployeeLoansTab';
import { EmployeeAssignedTasksSection } from './employee/EmployeeAssignedTasksSection';
import { EmployeePointageModal } from './employee/EmployeePointageModal';
import { EmployeeCustomTimeModal } from './employee/EmployeeCustomTimeModal';
import { EmployeeEmergencyDeclarationModal } from './employee/EmployeeEmergencyDeclarationModal';
import { EmployeeLoanRequestModal } from './employee/EmployeeLoanRequestModal';
import EmployeePayslipModal from './employee/EmployeePayslipModal';
import { EmployeeProfileTab } from './employee/EmployeeProfileTab';
import { EmployeeAlertsTab } from './employee/EmployeeAlertsTab';

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
  } = props;

  const logic = useEmployeePortalLogic(props);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {logic.toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#2A7B76] text-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-300">
          <div>
            <h4 className="font-bold text-xs">{logic.toastMessage.title}</h4>
            <p className="text-[11px] text-emerald-100">{logic.toastMessage.desc}</p>
          </div>
        </div>
      )}

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
          { id: 'incidents', label: 'Mes Incidents', icon: AlertTriangle, badge: logic.myIncidents.length },
          { id: 'salaries', label: 'Mes Salaires', icon: DollarSign, badge: undefined },
          { id: 'loans', label: 'Prêts & Avances', icon: CreditCard, badge: undefined },
          { id: 'tasks', label: 'Mes Tâches', icon: CheckSquare, badge: tasks.filter(t => t.assignedTo === logic.employeeProfile.id && t.status !== 'completed').length || undefined },
          { id: 'alerts', label: 'Mes Alertes', icon: Bell, badge: undefined },
          { id: 'profile', label: 'Mon Profil', icon: User, badge: undefined },
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

      {logic.activeTab === 'salaries' && (
        <EmployeeSalaryTab
          employeeProfile={logic.employeeProfile}
          mySalaryPayments={salaryPayments.filter(p => p.employeeId === logic.employeeProfile.id)}
          formatXAF={formatXAF}
          onSelectPayslip={logic.setSelectedPayslip}
        />
      )}

      {logic.activeTab === 'loans' && (
        <EmployeeLoansTab
          salaryDebts={salaryDebts}
          currentEmployeeId={logic.employeeProfile.id}
          onRequestLoan={() => logic.setShowLoanModal(true)}
          formatXAF={formatXAF}
        />
      )}

      {logic.activeTab === 'tasks' && (
        <EmployeeAssignedTasksSection
          tasks={tasks}
          employeeProfile={logic.employeeProfile}
          onUpdateTasks={onUpdateTasks}
        />
      )}

      {logic.activeTab === 'alerts' && (
        <EmployeeAlertsTab
          employeeProfile={logic.employeeProfile}
          currentUser={currentUser}
          tasks={tasks}
          incidents={props.attendanceIncidents || []}
          onAddNotification={onAddNotification}
        />
      )}

      {logic.activeTab === 'profile' && (
        <EmployeeProfileTab
          employeeProfile={logic.employeeProfile}
          currentUser={currentUser}
          presences={props.presences || []}
          tasks={tasks}
          incidents={props.attendanceIncidents || []}
          calculateTenure={logic.calculateTenure}
          onOpenProfileModal={onOpenProfileModal}
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
      />

      <EmployeeCustomTimeModal
        showCustomClockModal={logic.showCustomClockModal}
        setShowCustomClockModal={logic.setShowCustomClockModal}
        customClockHour={logic.customClockHour}
        setCustomClockHour={logic.setCustomClockHour}
        customClockMinute={logic.customClockMinute}
        setCustomClockMinute={logic.setCustomClockMinute}
        customClockReason={logic.customClockReason}
        setCustomClockReason={logic.setCustomClockReason}
        customClockError={logic.customClockError}
        setCustomClockError={logic.setCustomClockError}
        onConfirmCustomClock={logic.handleConfirmCustomClock}
      />

      <EmployeeEmergencyDeclarationModal
        showEmergencyModal={logic.showEmergencyModal}
        setShowEmergencyModal={logic.setShowEmergencyModal}
        emergencyType={logic.emergencyType}
        setEmergencyType={logic.setEmergencyType}
        emergencyReason={logic.emergencyReason}
        setEmergencyReason={logic.setEmergencyReason}
        onConfirmEmergency={logic.handleConfirmEmergency}
      />

      <EmployeeLoanRequestModal
        showLoanModal={logic.showLoanModal}
        setShowLoanModal={logic.setShowLoanModal}
        employeeProfile={logic.employeeProfile}
        onAddNotification={onAddNotification}
        onSuccess={() =>
          logic.showToast('Demande Envoyée', 'Votre demande de prêt a été transmise pour validation.', 'success')
        }
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
        />
      )}

      {logic.certifiedReport && (
        <RhReportModal
          isOpen={Boolean(logic.certifiedReport)}
          report={logic.certifiedReport}
          onClose={() => logic.setCertifiedReport(null)}
        />
      )}
    </div>
  );
}
