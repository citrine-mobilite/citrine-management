import React from 'react';
import { useAppInitialData } from './hooks/useAppInitialData';
import { useAppOrchestration } from './hooks/useAppOrchestration';
import { storeSecureSession } from './services/sessionService';
import { isEmployeeUser } from './utils/roleUtils';
import Sidebar from './components/Sidebar';
import { AppTopNavbar } from './components/navigation/AppTopNavbar';
import { AppTabRouter } from './components/navigation/AppTabRouter';
import { AppMobileBottomNav } from './components/navigation/AppMobileBottomNav';
import LoginModal from './components/LoginModal';
import ToastContainer from './components/Toast';
import { DatabaseHealthBanner } from './components/common/DatabaseHealthBanner';
import OfflineStatusBanner from './components/OfflineStatusBanner';
import { AppOverlays } from './components/app/AppOverlays';
import { GlobalActionLoader } from './components/common/GlobalActionLoader';
import { getHomeUrgentReminders } from './services/reminderService';

export default function App() {
  const initialData = useAppInitialData();
  const app = useAppOrchestration({
    employees: initialData.employees,
    presences: initialData.presences,
    notifications: initialData.notifications,
    leaveRequests: initialData.leaveRequests,
    attendanceIncidents: initialData.attendanceIncidents,
    moduleConfig: initialData.moduleConfig,
  });

  if (app.isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2A7B76] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-serif font-semibold text-stone-600">Chargement de Citrine Management...</p>
        </div>
      </div>
    );
  }

  if (!app.currentUser) {
    return (
      <div className="min-h-screen ambient-glass-bg flex flex-col justify-between relative overflow-hidden">
        <div className="fixed -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="fixed -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#D4A82F]/10 blur-3xl pointer-events-none" />
        <DatabaseHealthBanner />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <LoginModal
            users={initialData.users}
            onLoginSuccess={app.handleLoginSuccess}
            onAddNotification={initialData.handleAddNotification}
          />
        </div>
        <ToastContainer toasts={app.toasts} onDismiss={app.dismissToast} />
        <GlobalActionLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-glass-bg flex flex-col text-stone-900 font-sans selection:bg-[#2A7B76] selection:text-white relative">
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-[450px] h-[450px] rounded-full bg-[#D4A82F]/7 blur-[100px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/3 w-[600px] h-[600px] rounded-full bg-[#2A7B76]/5 blur-[140px] pointer-events-none -z-10" />

      <DatabaseHealthBanner />
      <OfflineStatusBanner />

      <AppTopNavbar
        currentUser={app.currentUser}
        activeTab={app.activeTab}
        setActiveTab={app.setActiveTab}
        onOpenProfile={() => app.setActiveTab('profile')}
        onOpenKioskModal={() => app.setKioskModalOpen(true)}
        onToggleMobileMenu={() => app.setMobileMenuOpen((prev) => !prev)}
        unreadNotificationsCount={app.unreadNotificationsCount}
        liveTimeString={app.currentTime}
        onOpenEmployeeAlerts={() => app.setActiveTab('communications')}
      />

      <div className="flex-1 flex w-full max-w-[1920px] mx-auto overflow-hidden relative">
        {!isEmployeeUser(app.currentUser) && (
          <Sidebar
            activeTab={app.activeTab}
            onSelectTab={(tab) => {
              app.setActiveTab(tab);
              app.setMobileMenuOpen(false);
            }}
            isOpen={app.isSidebarOpen}
            onToggleOpen={() => app.setIsSidebarOpen((prev) => !prev)}
            unreadRemindersCount={getHomeUrgentReminders(initialData.reminders).length}
            pendingPresencesRequestsCount={app.pendingPresencesRequestsCount}
            pendingLeavesCount={app.pendingLeavesCount}
            nonBadgedEmployeesCount={app.nonBadgedEmployeesCount}
            mobileMenuOpen={app.mobileMenuOpen}
            onToggleMobileMenu={() => app.setMobileMenuOpen((prev) => !prev)}
            onCloseMobileMenu={() => app.setMobileMenuOpen(false)}
            currentUser={app.currentUser}
            moduleConfig={initialData.moduleConfig}
          />
        )}

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-28 sm:pb-24 md:pb-8 space-y-4">
          <AppTabRouter
            activeTab={app.activeTab}
            setActiveTab={app.setActiveTab}
            currentUser={app.currentUser}
            employees={initialData.employees}
            presences={initialData.presences}
            tasks={initialData.tasks}
            reminders={initialData.reminders}
            notifications={initialData.notifications}
            salaryPayments={initialData.salaryPayments}
            financialTransactions={initialData.financialTransactions}
            salaryDebts={initialData.salaryDebts}
            documents={initialData.documents}
            disciplinaryIncidents={initialData.disciplinaryIncidents}
            attendanceIncidents={initialData.attendanceIncidents}
            inventoryItems={initialData.inventoryItems}
            partners={initialData.partners}
            users={initialData.users}
            moduleConfig={initialData.moduleConfig}
            selectedEmployeeId={app.selectedEmployeeId}
            setSelectedEmployeeId={app.setSelectedEmployeeId}
            currentTime={app.currentTime}
            onUpdatePresences={initialData.handleUpdatePresences}
            onUpdateTasks={initialData.setTasks}
            onUpdateReminders={initialData.setReminders}
            onAddNotification={initialData.handleAddNotification}
            onUpdateNotifications={initialData.setNotifications}
            onUpdateEmployees={initialData.handleUpdateEmployees}
            onUpdateSalaryDebts={initialData.setSalaryDebts}
            onUpdateSalaryPayments={initialData.setSalaryPayments}
            onUpdateFinancialTransactions={initialData.setFinancialTransactions}
            onUpdateDocuments={initialData.setDocuments}
            onUpdateDisciplinaryIncidents={initialData.setDisciplinaryIncidents}
            onUpdateAttendanceIncidents={initialData.handleUpdateAttendanceIncidents}
            onAddAttendanceIncident={initialData.handleAddAttendanceIncident}
            onUpdateInventoryItems={initialData.setInventoryItems}
            onUpdatePartners={initialData.setPartners}
            onUpdateUsers={initialData.setUsers}
            onUpdateModuleConfig={initialData.handleUpdateModuleConfig}
            onOpenProfileModal={() => app.setActiveTab('profile')}
            showToast={app.showToast}
            handleSetCurrentUser={app.setCurrentUser}
            onUpdateUser={(updated) => {
              app.setCurrentUser(updated);
              storeSecureSession(updated);
            }}
            leaveRequests={initialData.leaveRequests}
            onUpdateLeaveRequests={initialData.setLeaveRequests}
            strategicProjects={initialData.strategicProjects}
            onUpdateStrategicProjects={initialData.setStrategicProjects}
            onLogout={app.handleLogout}
          />
        </main>
      </div>

      <AppMobileBottomNav
        activeTab={app.activeTab}
        setActiveTab={app.setActiveTab}
        currentUser={app.currentUser}
        setMobileMenuOpen={app.setMobileMenuOpen}
      />

      <AppOverlays
        currentUser={app.currentUser}
        profileModalOpen={app.profileModalOpen}
        onCloseProfileModal={() => app.setProfileModalOpen(false)}
        kioskModalOpen={app.kioskModalOpen}
        onCloseKioskModal={() => app.setKioskModalOpen(false)}
        officeQrModalOpen={app.officeQrModalOpen}
        onCloseOfficeQrModal={() => app.setOfficeQrModalOpen(false)}
        onLaunchKioskFromQr={() => {
          app.setOfficeQrModalOpen(false);
          app.setKioskModalOpen(true);
        }}
        onLogout={app.handleLogout}
        onUpdateUser={app.setCurrentUser}
        employees={initialData.employees}
        presences={initialData.presences}
        moduleConfig={initialData.moduleConfig}
        onUpdatePresences={initialData.handleUpdatePresences}
        onAddNotification={initialData.handleAddNotification}
        onAddAttendanceIncident={initialData.handleAddAttendanceIncident}
        onNavigateTab={app.setActiveTab}
        toasts={app.toasts}
        onDismissToast={app.dismissToast}
      />
    </div>
  );
}
