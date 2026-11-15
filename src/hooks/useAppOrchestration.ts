import { useState, useEffect, useMemo, useRef } from 'react';
import { AppUser, Employee, Presence, NotificationLog, LeaveRequest, AttendanceIncident, CompanyModuleConfig } from '../types';
import { ToastMessage } from '../components/Toast';
import { loadSecureSession, storeSecureSession, clearSecureSession, canAccessTab } from '../services/sessionService';
import { safeStorage } from '../utils/safeStorage';
import { subscribeToUsers } from '../services/userService';
import { authService } from '../services/auth/authService';
import { supabase } from '../lib/supabase';
import { getDefaultPortalForUser } from '../utils/roleUtils';
import { TabType } from '../components/Sidebar';
import { showSuccessAlert, showErrorAlert, showPendingAlert } from '../utils/sweetAlert';
import { asyncActionTrackerService } from '../services/asyncActionTrackerService';
import { resolveToastPayload } from '../utils/toastTitleUtils';
import { computeUnreadNotificationsCount, computeNonBadgedEmployeesCount } from '../utils/appBadgeCounters';
import { registerGlobalErrorHandlers, clearSupabaseAuthStorage, hasUserProfileChanged } from '../utils/appLifecycleHelpers';

interface UseAppOrchestrationParams {
  employees: Employee[];
  presences: Presence[];
  notifications: NotificationLog[];
  leaveRequests: LeaveRequest[];
  attendanceIncidents: AttendanceIncident[];
  moduleConfig: CompanyModuleConfig;
}

export function useAppOrchestration({
  employees,
  presences,
  notifications,
  leaveRequests,
  attendanceIncidents,
  moduleConfig,
}: UseAppOrchestrationParams) {
  useEffect(() => {
    const logoBase64 = moduleConfig?.companyLogoBase64;
    if (logoBase64) {
      const links = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
      links.forEach((link) => {
        (link as HTMLLinkElement).href = logoBase64;
      });
    }
  }, [moduleConfig?.companyLogoBase64]);

  useEffect(() => registerGlobalErrorHandlers(), []);

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState<TabType>(
    () => (safeStorage.getItem('citrine_active_tab') as TabType) || 'dashboard'
  );
  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    safeStorage.setItem('citrine_active_tab', tab);
  };
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [kioskModalOpen, setKioskModalOpen] = useState(false);
  const [officeQrModalOpen, setOfficeQrModalOpen] = useState(false);
  const [toasts] = useState<ToastMessage[]>([]);

  const lastToastRef = useRef<{ message: string; time: number }>({ message: '', time: 0 });

  const showToast = (
    titleOrMessage: string,
    messageOrType?: string | 'success' | 'error' | 'warning' | 'info',
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => {
    const { resolvedTitle, resolvedMessage, resolvedType } = resolveToastPayload(
      titleOrMessage,
      messageOrType,
      type
    );

    const now = Date.now();
    if (lastToastRef.current.message === resolvedMessage && now - lastToastRef.current.time < 3500) {
      return;
    }
    lastToastRef.current = { message: resolvedMessage, time: now };

    (async () => {
      try {
        await asyncActionTrackerService.waitForIdle();
        await new Promise((r) => setTimeout(r, 60));

        if (resolvedType === 'error') {
          await showErrorAlert(resolvedTitle || "Échec de l'opération", resolvedMessage);
        } else if (resolvedType === 'warning' || resolvedType === 'info') {
          await showPendingAlert(resolvedTitle || 'Information Citrine', resolvedMessage);
        } else {
          await showSuccessAlert(resolvedTitle || 'Opération confirmée', resolvedMessage);
        }
      } catch (err) {
        console.warn("[App] Erreur lors de l'affichage de SweetAlert:", err);
      }
    })();
  };

  const dismissToast = (_id: string) => {};

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

  useEffect(() => {
    loadSecureSession()
      .then(async (user) => {
        if (user && user.email) {
          setCurrentUser(user);
          const savedTab = safeStorage.getItem('citrine_active_tab') as TabType;
          const defaultTab = getDefaultPortalForUser(user) as TabType;
          setActiveTabState(savedTab && canAccessTab(user.role, savedTab) ? savedTab : defaultTab);

          try {
            const { fetchDatabaseUserByEmail } = await import('../services/userService');
            const dbUser = await fetchDatabaseUserByEmail(user.email);
            if (dbUser && dbUser.status === 'actif') {
              setCurrentUser(dbUser);
              await storeSecureSession(dbUser);
            } else if (dbUser && dbUser.status !== 'actif') {
              clearSecureSession();
              safeStorage.removeItem('citrine_active_tab');
              setCurrentUser(null);
            }
          } catch (err) {
            console.warn('[App] Vérification de session en arrière-plan ignorée (mode hors-ligne ou timeout):', err);
          }
        }
        setIsAuthLoading(false);
      })
      .catch(() => setIsAuthLoading(false));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeToUsers((usersList) => {
      const latest = usersList.find(
        (u) => u.email.toLowerCase() === currentUser.email.toLowerCase() || u.id === currentUser.id
      );
      if (latest && hasUserProfileChanged(latest, currentUser)) {
        setCurrentUser(latest);
        storeSecureSession(latest);
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

  const handleLogout = async () => {
    clearSecureSession();
    safeStorage.removeItem('citrine_active_tab');
    try {
      await authService.logout();
    } catch {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    clearSupabaseAuthStorage();
    setCurrentUser(null);
    setProfileModalOpen(false);
    showToast('Vous avez été déconnecté.');
  };

  const unreadNotificationsCount = useMemo(
    () => computeUnreadNotificationsCount(notifications, currentUser),
    [notifications, currentUser]
  );

  const pendingLeavesCount = useMemo(
    () => leaveRequests.filter((l) => l.status === 'pending').length,
    [leaveRequests]
  );

  const pendingPresencesRequestsCount = useMemo(
    () => attendanceIncidents.filter((i) => i.status === 'signale' || !i.isJustified).length,
    [attendanceIncidents]
  );

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const nonBadgedEmployeesCount = useMemo(
    () => computeNonBadgedEmployeesCount(employees, presences, todayStr),
    [employees, presences, todayStr]
  );

  return {
    currentUser, setCurrentUser, isAuthLoading,
    activeTab, setActiveTab, selectedEmployeeId, setSelectedEmployeeId,
    isSidebarOpen, setIsSidebarOpen, mobileMenuOpen, setMobileMenuOpen,
    profileModalOpen, setProfileModalOpen, kioskModalOpen, setKioskModalOpen,
    officeQrModalOpen, setOfficeQrModalOpen, toasts, showToast, dismissToast,
    currentTime, handleLoginSuccess, handleLogout,
    unreadNotificationsCount, pendingLeavesCount, pendingPresencesRequestsCount, nonBadgedEmployeesCount,
  };
}
