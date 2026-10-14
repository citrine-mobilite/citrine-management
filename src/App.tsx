import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppUser, 
  Employee,
  Presence,
  Task,
  Reminder,
  NotificationLog,
  SalaryPayment,
  FinancialTransaction,
  EmployeeSalaryDebt,
  GeneratedDocument,
  DisciplinaryIncident,
  AttendanceIncident,
  InventoryItem,
  Partner,
  CompanyModuleConfig,
  LeaveRequest,
} from './types';
import { ToastMessage } from './components/Toast';
import { useAppInitialData } from './hooks/useAppInitialData';
import { loadSecureSession, storeSecureSession, clearSecureSession } from './services/sessionService';
import { subscribeToUsers } from './services/userService';
import { getDefaultPortalForUser, isEmployeeUser, isEmployeeOnlyRole } from './utils/roleUtils';
import Sidebar, { TabType } from './components/Sidebar';
import { AppTopNavbar } from './components/navigation/AppTopNavbar';
import { AppTabRouter } from './components/navigation/AppTabRouter';
import { AppMobileBottomNav } from './components/navigation/AppMobileBottomNav';
import LoginModal from './components/LoginModal';
import ProfileModal from './components/ProfileModal';
import KioskClockingModal from './components/KioskClockingModal';
import OfficeQRCodeModal from './components/OfficeQRCodeModal';
import ToastContainer from './components/Toast';
import { DatabaseHealthBanner } from './components/common/DatabaseHealthBanner';
import OfflineStatusBanner from './components/OfflineStatusBanner';
import { GlobalTooltipContainer } from './components/common/GlobalTooltipContainer';

export default function App() {
  const initialData = useAppInitialData();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [kioskModalOpen, setKioskModalOpen] = useState(false);
  const [officeQrModalOpen, setOfficeQrModalOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const deduceTitle = (text: string, t: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('pointage') || lower.includes('badgé') || lower.includes('arrivée') || lower.includes('départ') || lower.includes('pause')) return 'Pointage de Présence';
    if (lower.includes('permission') || lower.includes('congé') || lower.includes('absence')) return 'Demande de Permission / Congé';
    if (lower.includes('frais') || lower.includes('remboursement') || lower.includes('dépense')) return 'Note de Frais';
    if (lower.includes('paie') || lower.includes('salaire') || lower.includes('bulletin')) return 'Rémunération & Paie';
    if (lower.includes('prêt') || lower.includes('acompte')) return 'Avance & Prêt Financier';
    if (lower.includes('tâche') || lower.includes('task')) return 'Gestion des Tâches';
    if (lower.includes('incident') || lower.includes('retard') || lower.includes('discipline')) return 'Signalement RH / Incident';
    if (lower.includes('profil') || lower.includes('avatar') || lower.includes('mot de passe') || lower.includes('compte')) return 'Gestion du Profil';
    if (lower.includes('code') || lower.includes('badge') || lower.includes('qr')) return 'Code d’Accès & Badge';
    if (lower.includes('supprim') || lower.includes('annul')) return 'Suppression effectuée';
    if (lower.includes('modifi') || lower.includes('mis à jour')) return 'Mise à jour enregistrée';
    if (t === 'error') return 'Attention requise';
    if (t === 'warning') return 'Avertissement système';
    if (t === 'info') return 'Information Citrine';
    return 'Opération confirmée';
  };

  const showToast = (
    titleOrMessage: string,
    messageOrType?: string | 'success' | 'error' | 'warning' | 'info',
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => {
    let resolvedTitle = '';
    let resolvedMessage = '';
    let resolvedType: 'success' | 'error' | 'warning' | 'info' = 'success';

    if (type) {
      resolvedTitle = titleOrMessage;
      resolvedMessage = String(messageOrType || '');
      resolvedType = type;
    } else if (
      messageOrType === 'success' || 
      messageOrType === 'error' || 
      messageOrType === 'warning' || 
      messageOrType === 'info'
    ) {
      resolvedType = messageOrType;
      resolvedTitle = deduceTitle(titleOrMessage, resolvedType);
      resolvedMessage = titleOrMessage;
    } else if (typeof messageOrType === 'string' && messageOrType.trim().length > 0) {
      resolvedTitle = titleOrMessage;
      resolvedMessage = messageOrType;
      resolvedType = 'success';
    } else {
      resolvedType = 'success';
      resolvedTitle = deduceTitle(titleOrMessage, resolvedType);
      resolvedMessage = titleOrMessage;
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, title: resolvedTitle, message: resolvedMessage, type: resolvedType }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Clock
  const [currentTime, setCurrentTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Restore authenticated session on mount with database verification
  useEffect(() => {
    loadSecureSession().then(async (user) => {
      if (user && user.email) {
        try {
          const { fetchDatabaseUserByEmail } = await import('./services/userService');
          const dbUser = await fetchDatabaseUserByEmail(user.email);
          if (dbUser && dbUser.status === 'actif') {
            setCurrentUser(dbUser);
            await storeSecureSession(dbUser);
            setActiveTab(getDefaultPortalForUser(dbUser) as TabType);
          } else {
            // L'utilisateur n'existe plus en base de données ou est désactivé
            clearSecureSession();
            setCurrentUser(null);
          }
        } catch (err) {
          console.warn('[App] Erreur lors de la vérification de session en base:', err);
          clearSecureSession();
          setCurrentUser(null);
        }
      }
      setIsAuthLoading(false);
    }).catch(() => {
      setIsAuthLoading(false);
    });
  }, []);

  // Real-time synchronization of currentUser (avatar, name, phone, etc.) across devices
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUsers((usersList) => {
      const latest = usersList.find(
        (u) => u.email.toLowerCase() === currentUser.email.toLowerCase() || u.id === currentUser.id
      );
      if (latest) {
        if (
          latest.avatarUrl !== currentUser.avatarUrl ||
          latest.name !== currentUser.name ||
          latest.phone !== currentUser.phone ||
          latest.department !== currentUser.department
        ) {
          setCurrentUser(latest);
          storeSecureSession(latest);
        }
      }
    });
    return () => unsub();
  }, [currentUser?.email, currentUser?.id]);

  const handleLoginSuccess = async (user: AppUser) => {
    setCurrentUser(user);
    await storeSecureSession(user);
    setActiveTab(getDefaultPortalForUser(user) as TabType);
    showToast(`Bienvenue, ${user.name} !`);
  };

  const handleLogout = () => {
    clearSecureSession();
    setCurrentUser(null);
    setProfileModalOpen(false);
    showToast('Vous avez été déconnecté.');
  };

  // Badges counts
  const unreadNotificationsCount = useMemo(() => {
    if (!currentUser) return 0;
    const isEmp = isEmployeeUser(currentUser);
    if (!isEmp) {
      return initialData.notifications.filter((n) => !n.read).length;
    }
    return initialData.notifications.filter(
      (n) => !n.read && (
        n.recipient === currentUser.name || 
        n.recipient === currentUser.email || 
        n.recipient === 'Tous'
      )
    ).length;
  }, [initialData.notifications, currentUser]);

  const pendingLeavesCount = useMemo(() => {
    return initialData.leaveRequests.filter((l) => l.status === 'pending').length;
  }, [initialData.leaveRequests]);

  const pendingPresencesRequestsCount = useMemo(() => {
    return initialData.attendanceIncidents.filter((i) => i.status === 'signale' || !i.isJustified).length;
  }, [initialData.attendanceIncidents]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Décompte strict : seuls les employés badgent (les responsables et admins ne badgent pas).
  // Affiche uniquement le nombre d'employés qui n'ont pas badgé aujourd'hui (ex: 5 employés, 3 ont badgé -> affiche 2).
  const nonBadgedEmployeesCount = useMemo(() => {
    const eligibleEmployees = initialData.employees.filter((emp) => {
      if (emp.status === false || emp.status === 'parti' || emp.status === 'renvoye' || emp.status === 'demissionne' || emp.status === 'suspendu') return false;
      return isEmployeeOnlyRole(emp.roleType || emp.role);
    });

    if (eligibleEmployees.length === 0) return 0;

    const badgedIds = new Set(
      initialData.presences
        .filter((p) => p.date === todayStr && (Boolean(p.arrivalTime) || p.status === 'present' || p.status === 'late'))
        .map((p) => p.employeeId)
    );

    const badgedCount = eligibleEmployees.filter((emp) => badgedIds.has(emp.id)).length;
    return Math.max(0, eligibleEmployees.length - badgedCount);
  }, [initialData.employees, initialData.presences, todayStr]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2A7B76] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-serif font-semibold text-stone-600">Chargement de Citrine Management...</p>
        </div>
      </div>
    );
  }

  // Not authenticated -> Show Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col justify-between">
        <DatabaseHealthBanner />
        <div className="flex-1 flex items-center justify-center p-4">
          <LoginModal
            users={initialData.users}
            onLoginSuccess={handleLoginSuccess}
            onAddNotification={initialData.handleAddNotification}
          />
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 font-sans selection:bg-[#2A7B76] selection:text-white">
      {/* Database Diagnostic and Permission Health Banner */}
      <DatabaseHealthBanner />

      {/* Offline Status */}
      <OfflineStatusBanner />

      {/* Top Navbar */}
      <AppTopNavbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenKioskModal={() => setKioskModalOpen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        unreadNotificationsCount={unreadNotificationsCount}
        liveTimeString={currentTime}
        onOpenEmployeeAlerts={() => setActiveTab('communications')}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full max-w-[1920px] mx-auto overflow-hidden">
        {/* Desktop Sidebar (Admins & Managers) */}
        {!isEmployeeUser(currentUser) && (
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setMobileMenuOpen(false);
            }}
            isOpen={isSidebarOpen}
            onToggleOpen={() => setIsSidebarOpen((prev) => !prev)}
            unreadRemindersCount={initialData.reminders.filter((r) => !r.stopped && !r.triggered).length}
            pendingPresencesRequestsCount={pendingPresencesRequestsCount}
            pendingLeavesCount={pendingLeavesCount}
            nonBadgedEmployeesCount={nonBadgedEmployeesCount}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
            currentUser={currentUser}
            moduleConfig={initialData.moduleConfig}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-8">
          <AppTabRouter
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentUser={currentUser}
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
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={setSelectedEmployeeId}
            currentTime={currentTime}
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
            onOpenProfileModal={() => setActiveTab('profile')}
            showToast={showToast}
            handleSetCurrentUser={setCurrentUser}
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
              storeSecureSession(updated);
            }}
            leaveRequests={initialData.leaveRequests}
            onUpdateLeaveRequests={initialData.setLeaveRequests}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <AppMobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Profile Modal */}
      {profileModalOpen && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setProfileModalOpen(false)}
          onLogout={handleLogout}
          onAddNotification={initialData.handleAddNotification}
          onUpdateUser={(u) => {
            setCurrentUser(u);
            storeSecureSession(u);
          }}
        />
      )}

      {/* Kiosk Mode Clocking Modal */}
      {kioskModalOpen && (
        <KioskClockingModal
          isOpen={kioskModalOpen}
          onClose={() => setKioskModalOpen(false)}
          employees={initialData.employees}
          presences={initialData.presences}
          onUpdatePresences={initialData.handleUpdatePresences}
          onAddNotification={initialData.handleAddNotification}
          companyName={initialData.moduleConfig.companyName}
          moduleConfig={initialData.moduleConfig}
          onAddAttendanceIncident={initialData.handleAddAttendanceIncident}
        />
      )}

      {/* Office QR Code Modal */}
      {officeQrModalOpen && (
        <OfficeQRCodeModal
          isOpen={officeQrModalOpen}
          onClose={() => setOfficeQrModalOpen(false)}
          qrSecret={initialData.moduleConfig.qrCodeSecret}
          companyName={initialData.moduleConfig.companyName}
          managerName={currentUser.name}
          onLaunchKiosk={() => {
            setOfficeQrModalOpen(false);
            setKioskModalOpen(true);
          }}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Luxury Tooltip Engine */}
      <GlobalTooltipContainer />
    </div>
  );
}
