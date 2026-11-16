import { AppUser } from '../types';

export function registerGlobalErrorHandlers(): () => void {
  const handleGlobalError = (event: ErrorEvent) => {
    const msg = event.message || '';
    if (!msg.includes('WebSocket') && !msg.includes('vite/client')) {
      console.error('Global uncaught error caught:', event.error || event.message);
    }
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    if (!reasonStr.includes('WebSocket') && !reasonStr.includes('vite/client')) {
      console.error('Global unhandled promise rejection caught:', event.reason);
    }
  };

  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  return () => {
    window.removeEventListener('error', handleGlobalError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}

export function clearSupabaseAuthStorage(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
}

export function hasUserProfileChanged(latest: AppUser, current: AppUser): boolean {
  return (
    latest.avatarUrl !== current.avatarUrl ||
    latest.name !== current.name ||
    latest.phone !== current.phone ||
    latest.department !== current.department ||
    latest.birthDate !== current.birthDate ||
    latest.team !== current.team ||
    JSON.stringify(latest.teams || []) !== JSON.stringify(current.teams || []) ||
    latest.managerId !== current.managerId ||
    latest.managerName !== current.managerName ||
    latest.role !== current.role ||
    latest.status !== current.status ||
    Boolean(latest.allowEarlyDeparture15_17) !== Boolean(current.allowEarlyDeparture15_17) ||
    Boolean(latest.allowLateArrival8_930) !== Boolean(current.allowLateArrival8_930)
  );
}
