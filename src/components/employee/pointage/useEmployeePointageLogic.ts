import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ClockingMethod, CompanyModuleConfig, Employee } from '../../../types';
import { processScannedQrCode } from './pointageQrProcessor';
import { validateCode16Attendance } from './pointageCode16Helper';
import { usePointageScanLoop, decodeQrFromImageFile } from './usePointageScannerEffects';

export type PointageStep = 'select_method' | 'scan_door' | 'scan_dynamic' | 'code_16';

interface UseEmployeePointageLogicProps {
  showClockingModal: boolean;
  setShowClockingModal: (val: boolean) => void;
  pendingClockAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stopCameraScan: () => void;
  startCameraScan: () => void;
  employeeProfile: Employee;
  onConfirmClocking: (
    method: ClockingMethod,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ) => Promise<boolean> | void;
  showToast?: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
  moduleConfig?: CompanyModuleConfig;
}

export function useEmployeePointageLogic({
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
}: UseEmployeePointageLogicProps) {
  const [currentStep, setCurrentStep] = useState<PointageStep>('select_method');
  const [code16Input, setCode16Input] = useState<string>('');
  const [isValidatingCode16, setIsValidatingCode16] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState<boolean>(false);
  const [detectedQrCode, setDetectedQrCode] = useState<string | null>(null);
  const [isProcessingDetection, setIsProcessingDetection] = useState<boolean>(false);

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const officialSiteName = moduleConfig?.doorQrSiteName || moduleConfig?.hqName || 'Entrée Principale (HQ Siège)';
  const requireGpsStrict = moduleConfig?.doorQrRequireGps === true;

  const stopCameraAndInterval = useCallback(() => {
    stopCameraScan();
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, [stopCameraScan]);

  const prevShowClockingModalRef = useRef(false);
  useEffect(() => {
    if (showClockingModal && !prevShowClockingModalRef.current) {
      setCurrentStep('select_method');
      setCode16Input('');
      setManualTokenInput('');
      setActionError(null);
      setIsCapturingGps(false);
      setDetectedQrCode(null);
      setIsProcessingDetection(false);
    } else if (!showClockingModal && prevShowClockingModalRef.current) {
      stopCameraAndInterval();
    }
    prevShowClockingModalRef.current = showClockingModal;
  }, [showClockingModal, stopCameraAndInterval]);

  const getActionTitle = () => {
    switch (pendingClockAction) {
      case 'arrival':
        return 'Badger mon Arrivée';
      case 'pauseStart':
        return 'Badger mon Début de Pause';
      case 'pauseEnd':
        return 'Badger mon Retour de Pause';
      case 'departure':
        return 'Badger mon Départ';
      case 'sortieProStart':
        return 'Badger ma Sortie Professionnelle (Mission)';
      case 'sortieProEnd':
        return 'Badger mon Retour de Sortie Professionnelle';
      default:
        return 'Pointage de Présence';
    }
  };

  const handleClose = () => {
    stopCameraAndInterval();
    setShowClockingModal(false);
  };

  const handleBackToMethods = () => {
    stopCameraAndInterval();
    setCurrentStep('select_method');
    setActionError(null);
    setDetectedQrCode(null);
  };

  const handleProcessScannedQrCode = useCallback(
    async (scannedRaw: string) => {
      if (!scannedRaw || isProcessingDetection) return;
      await processScannedQrCode({
        scannedRaw,
        currentStep,
        employeeProfile,
        pendingClockAction,
        moduleConfig,
        officialSiteName,
        requireGpsStrict,
        stopCameraAndInterval,
        setIsProcessingDetection,
        setDetectedQrCode,
        setActionError,
        setIsCapturingGps,
        onConfirmClocking,
        setShowClockingModal,
        showToast,
      });
    },
    [
      isProcessingDetection,
      currentStep,
      employeeProfile,
      pendingClockAction,
      stopCameraAndInterval,
      onConfirmClocking,
      showToast,
      moduleConfig,
      officialSiteName,
      requireGpsStrict,
      setShowClockingModal,
    ]
  );

  usePointageScanLoop({
    currentStep,
    isProcessingDetection,
    videoRef,
    hiddenCanvasRef,
    scanIntervalRef,
    setDetectedQrCode,
    handleProcessScannedQrCode,
  });

  const handleSelectOption = (option: 'scan_door' | 'scan_dynamic' | 'code_16') => {
    setActionError(null);
    setCurrentStep(option);
    setDetectedQrCode(null);
    setIsProcessingDetection(false);
    if (option === 'scan_door' || option === 'scan_dynamic') {
      startCameraScan();
    } else {
      stopCameraScan();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    decodeQrFromImageFile(
      file,
      (data) => handleProcessScannedQrCode(data),
      () => setActionError("Aucun QR Code valide n'a été détecté sur cette photo. Veuillez prendre une image plus nette.")
    );
  };

  const handleValidateCode16 = () =>
    validateCode16Attendance({
      code16Input,
      employeeProfile,
      officialSiteName,
      requireGpsStrict,
      setActionError,
      setIsValidatingCode16,
      onConfirmClocking,
      setShowClockingModal,
      showToast,
      fallbackProcessQr: handleProcessScannedQrCode,
    });

  const handleFormatCode16Input = (val: string) => {
    const cleaned = val.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += '-';
      formatted += cleaned[i];
    }
    setCode16Input(formatted);
    setActionError(null);
  };

  return {
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
  };
}
