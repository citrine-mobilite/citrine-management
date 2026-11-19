import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, RefreshCw, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { dynamicQrService } from '../../services/dynamicQrService';
import { DynamicQrSession } from '../../types';

interface DynamicQrManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerName?: string;
  managerId?: string;
  onSessionUsed?: (employeeName: string) => void;
}

export const DynamicQrManagerModal: React.FC<DynamicQrManagerModalProps> = ({
  isOpen,
  onClose,
  managerName = 'Responsable',
  managerId = 'admin',
  onSessionUsed,
}) => {
  const [currentSession, setCurrentSession] = useState<DynamicQrSession | null>(null);
  const [usedNotification, setUsedNotification] = useState<{ employeeName: string; time: string } | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [isRotating, setIsRotating] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const cycleStartRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  // Initialize session and rotating loop
  useEffect(() => {
    if (!isOpen) {
      if (sessionIdRef.current) {
        dynamicQrService.closeSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setUsedNotification(null);
      return;
    }

    let isMounted = true;

    const startNewCycle = async () => {
      try {
        setIsRotating(true);
        const session = await dynamicQrService.createSession(managerId, managerName);
        if (!isMounted) return;
        sessionIdRef.current = session.id;
        setCurrentSession(session);
        cycleStartRef.current = Date.now();
        setProgressPercent(100);
      } catch (err) {
        console.error('Erreur de création de session QR:', err);
      } finally {
        setIsRotating(false);
      }
    };

    startNewCycle();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sessionIdRef.current) {
        dynamicQrService.closeSession(sessionIdRef.current);
      }
    };
  }, [isOpen, managerId, managerName]);

  // Subscribe to real-time status of the current session
  useEffect(() => {
    if (!currentSession?.id) return;

    const unsub = dynamicQrService.subscribeToSession(currentSession.id, (updated) => {
      if (!updated) return;
      if (updated.status === 'used') {
        const empName = updated.usedByEmployeeName || 'Collaborateur';
        const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setUsedNotification({ employeeName: empName, time: timeStr });
        if (onSessionUsed) {
          onSessionUsed(empName);
        }

        // Auto-close modal after brief visual confirmation (1.5 seconds)
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    });

    return () => unsub();
  }, [currentSession?.id, onClose, onSessionUsed]);

  // Smooth continuous progress bar animation over 30 seconds
  useEffect(() => {
    if (!isOpen || !currentSession || usedNotification) return;

    const DURATION_MS = 30000;

    const tick = () => {
      const elapsed = Date.now() - cycleStartRef.current;
      const remainingRatio = Math.max(0, 1 - elapsed / DURATION_MS);
      setProgressPercent(remainingRatio * 100);

      if (elapsed >= DURATION_MS) {
        // Trigger 30s token rotation
        cycleStartRef.current = Date.now();
        setProgressPercent(100);
        if (sessionIdRef.current) {
          dynamicQrService.renewSessionToken(sessionIdRef.current).then((renewed) => {
            if (renewed) setCurrentSession(renewed);
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, currentSession, usedNotification]);

  if (!isOpen) return null;

  const currentToken = currentSession?.token || 'CITRINE-DYN-LOADING';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(currentToken)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-xl">
              <QrCode className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm">QR Code Dynamique de Pointage</h3>
              <p className="text-[10px] text-emerald-100">Renouvelé toutes les 30s • Validation sur place</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center flex-1">
          {usedNotification ? (
            /* Success confirmation screen before closing */
            <div className="py-8 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-stone-900">Pointage Validé avec Succès !</h4>
                <p className="text-xs text-stone-600">
                  <span className="font-bold text-emerald-800">{usedNotification.employeeName}</span> a pointé sa présence à {usedNotification.time}.
                </p>
                <div className="inline-block mt-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold">
                  Fermeture automatique de la fenêtre...
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3 w-3 text-[#2A7B76]" /> Présence physique certifiée
                </div>
                <h4 className="text-sm font-bold text-stone-900">
                  Présentez cet écran au collaborateur
                </h4>
                <p className="text-xs text-stone-500">
                  L'employé scanne ce code avec son téléphone. Aucune géolocalisation n'est demandée car vous attestez de sa présence sur place.
                </p>
              </div>

              {/* QR Code Container with 30s Smooth Progress Bar */}
              <div className="space-y-3 bg-stone-50 p-4 rounded-3xl border border-stone-200/80">
                {/* Progress bar emptying smoothly */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 px-1">
                    <span className="flex items-center gap-1">
                      <RefreshCw className={`h-3 w-3 text-[#2A7B76] ${isRotating ? 'animate-spin' : ''}`} />
                      Actualisation automatique
                    </span>
                    <span className="font-mono text-[#2A7B76]">
                      {Math.ceil((progressPercent / 100) * 30)}s
                    </span>
                  </div>

                  {/* Smooth horizontal progress bar */}
                  <div className="h-2.5 w-full bg-stone-200 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-[#2A7B76] via-emerald-500 to-[#D4A82F] rounded-full transition-all duration-75 ease-linear shadow-xs"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* QR Code image */}
                <div className="p-3 bg-white rounded-2xl border border-stone-200 shadow-sm inline-block">
                  <img
                    src={qrImageUrl}
                    alt="QR Code Dynamique"
                    className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-lg"
                  />
                </div>

                <div className="text-[10px] text-stone-400 italic">
                  Ce QR code change automatiquement toutes les 30 secondes et s'invalide dès le premier scan.
                </div>
              </div>

              {/* Bottom indicator */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                <span>Responsable sur place : <b className="text-stone-800">{managerName}</b></span>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer text-xs"
                >
                  Fermer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicQrManagerModal;
