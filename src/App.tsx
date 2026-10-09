import React, { useState, useEffect, useCallback } from 'react';
import { AppUser, Role, UserRole } from './types';
import { TabType, ToastMessage } from './components';
import Sidebar from './components/Sidebar';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import OfflineStatusBanner from './components/OfflineStatusBanner';
import ToastContainer from './components/Toast';
import { PushNotificationManagerModal } from './components/PushNotificationManagerModal';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { AppTopNavbar } from './components/navigation/AppTopNavbar';
import { AppMobileBottomNav } from './components/navigation/AppMobileBottomNav';
import { AppTabRouter } from './components/navigation/AppTabRouter';
import { useAppInitialData } from './hooks/useAppInitialData';
import { loadSecureSession, storeSecureSession, clearSecureSession } from './services/sessionService';
import { soundService } from './services/soundService';
import { haptic } from './services/hapticService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('emp-1');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showPushModal, setShowPushModal] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    let hash = '';
    try {
      if (typeof window !== 'undefined' && window.location && typeof window.location.hash === 'string') {
        hash = window.location.hash.replace(/^#\/?/, '');
      }
    } catch {}
    const validTabs: TabType[] = [
      'dashboard', 'employee_portal', 'calls', 'presences', 'statistics', 'tasks',
      'reminders', 'logs', 'collaborators', 'discipline', 'documents', 'communications',
      'finances', 'inventory', 'partners', 'recruitment', 'expense_claims', 'hse',
      'visitors', 'ideas_surveys', 'users', 'settings', 'profile', ''
    ];
    if (validTabs.includes(hash as TabType)) return hash as TabType;
    return 'dashboard';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      message,
      type,
    };
    setToasts((prev) => [...prev.slice(-4), newToast]);
    if (type === 'error') {
      soundService.playAlertNotification(0.75);
    }
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const data = useAppInitialData();

  // Real-time clock
  const [liveTimeString, setLiveTimeString] = useState<string>('');
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setLiveTimeString(
        d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Secure session initialization
  useEffect(() => {
    loadSecureSession().then((user) => {
      if (user) {
        setCurrentUser(user);
        if (user.role === 'employé') {
          setActiveTab('employee_portal');
        }
      }
    });
  }, []);

  const handleSetCurrentUser = (user: AppUser | null) => {
    setCurrentUser(user);
    if (user) {
      storeSecureSession(user);
      if (user.role === 'employé') {
        setActiveTab('employee_portal');
      } else {
        setActiveTab('dashboard');
      }
    } else {
      clearSecureSession();
    }
  };

  const pendingRequestsCount = data.presences.reduce((count, p) => {
    let add = 0;
    if (p.emergencies) add += p.emergencies.filter((e) => e.status === 'pending').length;
    if (p.correctionReasonStatus === 'pending') add += 1;
    if (p.departureReasonStatus === 'pending') add += 1;
    return count + add;
  }, 0);

  const unreadRemindersCount = data.reminders.filter((r) => r.status === 'pending').length;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <LoginModal
          users={data.users}
          onAddNotification={data.handleAddNotification}
          onLoginSuccess={handleSetCurrentUser}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/90 text-stone-900 flex flex-col antialiased">
      {/* Top Navbar */}
      <AppTopNavbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenKioskModal={() => {}}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        unreadNotificationsCount={unreadRemindersCount + pendingRequestsCount}
        liveTimeString={liveTimeString}
      />

      {/* Main Container */}
      <div className="flex-1 flex min-w-0">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            haptic.light();
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          isOpen={isSidebarOpen}
          onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
          unreadRemindersCount={unreadRemindersCount}
          pendingPresencesRequestsCount={pendingRequestsCount}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          currentUser={currentUser}
          moduleConfig={data.moduleConfig}
        />

        {/* Tab Content Panel with safe bottom padding for mobile */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden pb-32 sm:pb-12">
          {/* Offline & PWA Banners */}
          <OfflineStatusBanner />
          <PwaInstallBanner />

          {/* Router Content */}
          <AppTabRouter
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
            employees={data.employees}
            presences={data.presences}
            tasks={data.tasks}
            reminders={data.reminders}
            notifications={data.notifications}
            salaryPayments={data.salaryPayments}
            financialTransactions={data.financialTransactions}
            salaryDebts={data.salaryDebts}
            documents={data.documents}
            disciplinaryIncidents={data.disciplinaryIncidents}
            attendanceIncidents={data.attendanceIncidents}
            inventoryItems={data.inventoryItems}
            partners={data.partners}
            users={data.users}
            moduleConfig={data.moduleConfig}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
            currentTime={liveTimeString}
            onUpdatePresences={data.handleUpdatePresences}
            onUpdateTasks={data.setTasks}
            onUpdateReminders={data.setReminders}
            onAddNotification={data.handleAddNotification}
            onUpdateNotifications={data.setNotifications}
            onUpdateEmployees={data.handleUpdateEmployees}
            onUpdateSalaryDebts={data.setSalaryDebts}
            onUpdateSalaryPayments={data.setSalaryPayments}
            onUpdateFinancialTransactions={data.setFinancialTransactions}
            onUpdateDocuments={data.setDocuments}
            onUpdateDisciplinaryIncidents={data.setDisciplinaryIncidents}
            onUpdateAttendanceIncidents={data.handleUpdateAttendanceIncidents}
            onAddAttendanceIncident={data.handleAddAttendanceIncident}
            onUpdateInventoryItems={data.setInventoryItems}
            onUpdatePartners={data.setPartners}
            onUpdateUsers={data.setUsers}
            onUpdateModuleConfig={data.handleUpdateModuleConfig}
            onOpenProfileModal={() => setActiveTab('profile')}
            showToast={showToast}
            handleSetCurrentUser={handleSetCurrentUser}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation (Responsive & Hero Palette) */}
      <AppMobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Push Notifications Manager */}
      {showPushModal && (
        <PushNotificationManagerModal
          isOpen={showPushModal}
          onClose={() => setShowPushModal(false)}
          currentUser={currentUser}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
