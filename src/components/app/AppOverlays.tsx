import React from 'react';
import { AppUser, Employee, Presence, NotificationLog, CompanyModuleConfig, AttendanceIncident } from '../../types';
import { TabType } from '../Sidebar';
import ProfileModal from '../ProfileModal';
import KioskClockingModal from '../KioskClockingModal';
import OfficeQRCodeModal from '../OfficeQRCodeModal';
import ToastContainer, { ToastMessage } from '../Toast';
import { GlobalTooltipContainer } from '../common/GlobalTooltipContainer';
import { PushNotificationPopupContainer } from '../notifications/PushNotificationPopupContainer';
import { GlobalActionLoader } from '../common/GlobalActionLoader';
import { PwaUpdateToast } from '../pwa/PwaUpdateToast';
import { storeSecureSession } from '../../services/sessionService';

interface AppOverlaysProps {
  currentUser: AppUser;
  profileModalOpen: boolean;
  onCloseProfileModal: () => void;
  kioskModalOpen: boolean;
  onCloseKioskModal: () => void;
  officeQrModalOpen: boolean;
  onCloseOfficeQrModal: () => void;
  onLaunchKioskFromQr: () => void;
  onLogout: () => Promise<void>;
  onUpdateUser: (u: AppUser) => void;
  employees: Employee[];
  presences: Presence[];
  moduleConfig: CompanyModuleConfig;
  onUpdatePresences: (updated: Presence[]) => void;
  onAddNotification: (n: NotificationLog) => void;
  onAddAttendanceIncident: (inc: AttendanceIncident) => void;
  onNavigateTab: (tab: TabType) => void;
  toasts: ToastMessage[];
  onDismissToast: (id: string) => void;
}

export const AppOverlays: React.FC<AppOverlaysProps> = ({
  currentUser,
  profileModalOpen,
  onCloseProfileModal,
  kioskModalOpen,
  onCloseKioskModal,
  officeQrModalOpen,
  onCloseOfficeQrModal,
  onLaunchKioskFromQr,
  onLogout,
  onUpdateUser,
  employees,
  presences,
  moduleConfig,
  onUpdatePresences,
  onAddNotification,
  onAddAttendanceIncident,
  onNavigateTab,
  toasts,
  onDismissToast,
}) => {
  return (
    <>
      {profileModalOpen && (
        <ProfileModal
          currentUser={currentUser}
          onClose={onCloseProfileModal}
          onLogout={onLogout}
          onAddNotification={onAddNotification}
          onUpdateUser={(u) => {
            onUpdateUser(u);
            storeSecureSession(u);
          }}
        />
      )}

      {kioskModalOpen && (
        <KioskClockingModal
          isOpen={kioskModalOpen}
          onClose={onCloseKioskModal}
          employees={employees}
          presences={presences}
          onUpdatePresences={onUpdatePresences}
          onAddNotification={onAddNotification}
          companyName={moduleConfig.companyName}
          moduleConfig={moduleConfig}
          onAddAttendanceIncident={onAddAttendanceIncident}
        />
      )}

      {officeQrModalOpen && (
        <OfficeQRCodeModal
          isOpen={officeQrModalOpen}
          onClose={onCloseOfficeQrModal}
          qrSecret={moduleConfig.qrCodeSecret}
          companyName={moduleConfig.companyName}
          managerName={currentUser.name}
          onLaunchKiosk={onLaunchKioskFromQr}
        />
      )}

      <PushNotificationPopupContainer onNavigateTab={onNavigateTab} />
      <ToastContainer toasts={toasts} onDismiss={onDismissToast} />
      <GlobalTooltipContainer />
      <GlobalActionLoader />
      <PwaUpdateToast />
    </>
  );
};
