import React from 'react';
import { X, AlertCircle, ArrowLeft } from 'lucide-react';
import { ClockingMethod, Employee, CompanyModuleConfig } from '../../types';
import { useEmployeePointageLogic } from './pointage/useEmployeePointageLogic';
import { PointageMethodSelectorStep } from './pointage/PointageMethodSelectorStep';
import { PointageQrScannerStep } from './pointage/PointageQrScannerStep';
import { PointageCode16Step } from './pointage/PointageCode16Step';

interface EmployeePointageModalProps {
  showClockingModal: boolean;
  setShowClockingModal: (val: boolean) => void;
  pendingClockAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | null;
  selectedClockMethod: ClockingMethod;
  setSelectedClockMethod: (val: ClockingMethod) => void;
  qrCodeError: string | null;
  setQrCodeError: (val: string | null) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stopCameraScan: () => void;
  startCameraScan: () => void;
  isLocating: boolean;
  employeeProfile: Employee;
  onConfirmClocking: (
    method: ClockingMethod,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ) => Promise<boolean> | void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
}

export const EmployeePointageModal: React.FC<EmployeePointageModalProps> = ({
  showClockingModal,
  setShowClockingModal,
  pendingClockAction,
  videoRef,
  stopCameraScan,
  startCameraScan,
  employeeProfile,
  onConfirmClocking,
  showToast,
  moduleConfig,
}) => {
  const {
    currentStep,
    code16Input,
    isValidatingCode16,
    manualTokenInput,
    setManualTokenInput,
    actionError,
    setActionError,
    isCapturingGps,
    detectedQrCode,
    setDetectedQrCode,
    isProcessingDetection,
    setIsProcessingDetection,
    fileInputRef,
    officialSiteName,
    getActionTitle,
    handleClose,
    handleBackToMethods,
    handleProcessScannedQrCode,
    handleSelectOption,
    handleImageUpload,
    handleValidateCode16,
    handleFormatCode16Input,
  } = useEmployeePointageLogic({
    showClockingModal,
    setShowClockingModal,
    pendingClockAction,
    videoRef,
    stopCameraScan,
    startCameraScan,
    employeeProfile,
    onConfirmClocking,
    showToast,
    moduleConfig,
  });

  if (!showClockingModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-modal rounded-3xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between shrink-0 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            {currentStep !== 'select_method' && (
              <button
                type="button"
                onClick={handleBackToMethods}
                className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
                title="Retour au choix des méthodes"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h3 className="font-serif font-bold text-sm">{getActionTitle()}</h3>
              <p className="text-[10px] text-emerald-100">
                {currentStep === 'select_method'
                  ? 'Sélectionnez votre option de pointage'
                  : currentStep === 'scan_door'
                  ? 'QR Code Fixe de la Porte (Détection Automatique)'
                  : currentStep === 'scan_dynamic'
                  ? 'QR Code Dynamique du Responsable (Sans GPS)'
                  : 'Clé Temporaire 16 Caractères'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {actionError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-in slide-in-from-top duration-200">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{actionError}</div>
            </div>
          )}

          {currentStep === 'select_method' && (
            <PointageMethodSelectorStep onSelectOption={handleSelectOption} />
          )}

          {(currentStep === 'scan_door' || currentStep === 'scan_dynamic') && (
            <PointageQrScannerStep
              currentStep={currentStep}
              officialSiteName={officialSiteName}
              videoRef={videoRef}
              isProcessingDetection={isProcessingDetection}
              isCapturingGps={isCapturingGps}
              detectedQrCode={detectedQrCode}
              manualTokenInput={manualTokenInput}
              setManualTokenInput={setManualTokenInput}
              fileInputRef={fileInputRef}
              onProcessScannedQrCode={handleProcessScannedQrCode}
              onResetScan={() => {
                setDetectedQrCode(null);
                setIsProcessingDetection(false);
                startCameraScan();
              }}
              onImageUpload={handleImageUpload}
              onSetActionError={setActionError}
            />
          )}

          {currentStep === 'code_16' && (
            <PointageCode16Step
              code16Input={code16Input}
              isValidatingCode16={isValidatingCode16}
              onFormatCode16Input={handleFormatCode16Input}
              onValidateCode16={handleValidateCode16}
            />
          )}
        </div>
      </div>
    </div>
  );
};
export default EmployeePointageModal;
