import React from 'react';
import { AppUser, CompanyModuleConfig, Employee } from '../../types';
import OfficeQRCodeModal from '../OfficeQRCodeModal';
import RhReportModal from '../RhReportModal';
import { EmployeePointageModal } from './EmployeePointageModal';
import { EmployeeCustomTimeModal } from './EmployeeCustomTimeModal';
import { EmployeeEmergencyDeclarationModal } from './EmployeeEmergencyDeclarationModal';
import { EmployeeLoanRequestModal } from './EmployeeLoanRequestModal';
import EmployeePayslipModal from './EmployeePayslipModal';

interface EmployeePortalModalsProps {
  logic: any;
  currentUser: AppUser | null;
  moduleConfig?: CompanyModuleConfig;
  formatXAF: (amount?: number) => string;
}

export const EmployeePortalModals: React.FC<EmployeePortalModalsProps> = ({
  logic,
  moduleConfig,
  formatXAF,
}) => {
  return (
    <>
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
          companyName={moduleConfig?.companyName || 'Citrine SARL'}
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
    </>
  );
};
