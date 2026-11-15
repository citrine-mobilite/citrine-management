import React, { useState, useRef, useCallback } from 'react';
import { ClockingMethod, EmergencyType, Employee, Presence } from '../../../types';
import { getCurrentUserLocation } from '../../../utils/geolocation';
import { buildMonthlyAttendanceReport, AttendanceMonthlyReport } from '../../../services/rhReportService';

interface UsePortalClockingAndReportParams {
  employeeProfile: Employee;
  presences: Presence[];
  todayPresence?: Presence;
  pendingClockAction: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | null;
  setPendingClockAction: (v: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd' | null) => void;
  setShowClockingModal: (v: boolean) => void;
  setQrCodeError: (v: string | null) => void;
  customClockHour: string;
  customClockMinute: string;
  customClockReason: string;
  setCustomClockError: (v: string | null) => void;
  setShowCustomClockModal: (v: boolean) => void;
  emergencyType: EmergencyType;
  emergencyReason: string;
  setEmergencyReason: (v: string) => void;
  setShowEmergencyModal: (v: boolean) => void;
  triggerConfirmClocking: (
    action: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure' | 'sortieProStart' | 'sortieProEnd',
    method: ClockingMethod,
    onDone: () => void,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ) => void;
  triggerConfirmCustomClock: (
    hour: string,
    minute: string,
    reason: string,
    setError: (v: string | null) => void,
    onDone: () => void
  ) => void;
  triggerConfirmEmergency: (type: EmergencyType, reason: string, onDone: () => void) => Promise<void>;
  showToast: (title: string, desc: string, type?: 'success' | 'warning' | 'info') => void;
}

export function usePortalClockingAndReport(params: UsePortalClockingAndReportParams) {
  const [certifiedReport, setCertifiedReport] = useState<AttendanceMonthlyReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [portalReportMonth, setPortalReportMonth] = useState<string>('2026-10');
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);

  const [sensorsDiagnostic, setSensorsDiagnostic] = useState<{
    status: 'idle' | 'scanning' | 'done';
    gps: { ok: boolean; coords?: string; error?: string };
    camera: { ok: boolean; error?: string };
  }>({ status: 'idle', gps: { ok: false }, camera: { ok: false } });

  const runSensorsDiagnostic = async () => {
    setSensorsDiagnostic({ status: 'scanning', gps: { ok: false }, camera: { ok: false } });
    let gpsOk = false, gpsCoords = '', gpsError = '', cameraOk = false, cameraError = '';
    try {
      const loc = await getCurrentUserLocation();
      gpsOk = true;
      gpsCoords = `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°`;
    } catch (e: any) {
      gpsError = e.message || 'GPS indisponible';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach((t) => t.stop());
      cameraOk = true;
    } catch (e: any) {
      cameraError = e.message || 'Caméra inaccessible';
    }

    setSensorsDiagnostic({
      status: 'done',
      gps: { ok: gpsOk, coords: gpsCoords, error: gpsError },
      camera: { ok: cameraOk, error: cameraError },
    });
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCameraScan = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      params.setQrCodeError('Impossible d’accéder à la caméra. Vérifiez les autorisations.');
    }
  }, [params.setQrCodeError]);

  const stopCameraScan = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleGeneratePortalReport = async (month?: string) => {
    setIsGeneratingReport(true);
    try {
      let targetMonth = month || portalReportMonth || '2026-10';
      if (targetMonth < '2026-10') {
        targetMonth = '2026-10';
      }
      const report = await buildMonthlyAttendanceReport(params.employeeProfile, params.presences, targetMonth);
      setCertifiedReport(report);
    } catch {
      params.showToast('Erreur', 'Impossible de générer le rapport RH', 'warning');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleConfirmClocking = (
    method: ClockingMethod,
    customLocation?: { latitude?: number; longitude?: number; locationName?: string; qrCodeToken?: string }
  ) => {
    const effectiveAction =
      params.pendingClockAction ||
      (!params.todayPresence?.arrivalTime ? 'arrival' : !params.todayPresence?.departureTime ? 'departure' : 'arrival');
    params.triggerConfirmClocking(
      effectiveAction,
      method,
      () => {
        stopCameraScan();
        params.setShowClockingModal(false);
        params.setPendingClockAction(null);
      },
      customLocation
    );
  };

  const handleConfirmCustomClock = () => {
    params.triggerConfirmCustomClock(
      params.customClockHour,
      params.customClockMinute,
      params.customClockReason,
      params.setCustomClockError,
      () => params.setShowCustomClockModal(false)
    );
  };

  const handleConfirmEmergency = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    if (isSubmittingEmergency) return;
    setIsSubmittingEmergency(true);
    try {
      await params.triggerConfirmEmergency(params.emergencyType, params.emergencyReason, () => {
        params.setShowEmergencyModal(false);
        params.setEmergencyReason('');
      });
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  return {
    sensorsDiagnostic,
    runSensorsDiagnostic,
    videoRef,
    startCameraScan,
    stopCameraScan,
    portalReportMonth,
    setPortalReportMonth,
    certifiedReport,
    setCertifiedReport,
    isGeneratingReport,
    handleGeneratePortalReport,
    handleConfirmClocking,
    handleConfirmCustomClock,
    handleConfirmEmergency,
    isSubmittingEmergency,
  };
}
