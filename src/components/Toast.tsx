import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/**
 * SweetAlert Universal Alert Component for all modules across Citrine
 * Renders centered, animated SweetAlert dialogs for success, failure, warning, and info
 */
export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (!toasts || toasts.length === 0) return null;

  // Active toast is the last one added (queue)
  const currentToast = toasts[toasts.length - 1];
  const remainingCount = toasts.length - 1;

  return (
    <SweetAlertModal
      key={currentToast.id}
      toast={currentToast}
      remainingCount={remainingCount}
      onDismiss={() => onDismiss(currentToast.id)}
    />
  );
}

const SweetAlertModal: React.FC<{
  toast: ToastMessage;
  remainingCount: number;
  onDismiss: () => void;
}> = ({ toast, remainingCount, onDismiss }) => {
  const duration = toast.duration || (toast.type === 'error' ? 5000 : 3500);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const type = toast.type || 'success';

  const config = {
    success: {
      titleDefault: 'Opération réussie !',
      btnText: 'OK, Continuer',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-emerald-500/20',
      progressBarBg: 'bg-emerald-500',
      ringColor: 'border-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      badgeText: 'Succès',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      accentGlow: 'shadow-emerald-900/10',
    },
    error: {
      titleDefault: 'Échec de l\'opération',
      btnText: 'Fermer',
      btnColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 ring-rose-500/20',
      progressBarBg: 'bg-rose-500',
      ringColor: 'border-rose-500',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
      badgeText: 'Erreur',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      accentGlow: 'shadow-rose-900/10',
    },
    warning: {
      titleDefault: 'Avertissement',
      btnText: 'Compris',
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30 ring-amber-500/20',
      progressBarBg: 'bg-amber-500',
      ringColor: 'border-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      badgeText: 'Attention',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      accentGlow: 'shadow-amber-900/10',
    },
    info: {
      titleDefault: 'Information',
      btnText: 'D\'accord',
      btnColor: 'bg-[#2A7B76] hover:bg-[#20635F] text-white shadow-teal-700/30 ring-teal-500/20',
      progressBarBg: 'bg-[#2A7B76]',
      ringColor: 'border-[#2A7B76]',
      bgColor: 'bg-teal-50',
      textColor: 'text-[#2A7B76]',
      badgeText: 'Info',
      badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
      accentGlow: 'shadow-teal-900/10',
    },
  }[type];

  const title = toast.title || config.titleDefault;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onDismiss}
      role="alertdialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl border border-stone-200/90 text-center flex flex-col items-center space-y-4 animate-in zoom-in-95 duration-200 relative overflow-hidden ${config.accentGlow}`}
      >
        {/* Dismiss 'X' Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition cursor-pointer"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Counter Badge if multiple alerts queued */}
        {remainingCount > 0 && (
          <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
            +{remainingCount} autre{remainingCount > 1 ? 's' : ''}
          </div>
        )}

        {/* SweetAlert Iconic Animated Circle */}
        <div className="pt-2">
          {type === 'success' && (
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/30 bg-emerald-50/80 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-md shadow-emerald-500/10">
              <span className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-25" />
              <svg
                className="w-10 h-10 text-emerald-600 animate-in zoom-in duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {type === 'error' && (
            <div className="w-20 h-20 rounded-full border-4 border-rose-500/30 bg-rose-50/80 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-md shadow-rose-500/10">
              <span className="absolute inset-0 rounded-full border-2 border-rose-500 animate-ping opacity-25" />
              <svg
                className="w-10 h-10 text-rose-600 animate-in zoom-in duration-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          {type === 'warning' && (
            <div className="w-20 h-20 rounded-full border-4 border-amber-500/30 bg-amber-50/80 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-md shadow-amber-500/10">
              <span className="absolute inset-0 rounded-full border-2 border-amber-500 animate-ping opacity-25" />
              <svg
                className="w-10 h-10 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}

          {type === 'info' && (
            <div className="w-20 h-20 rounded-full border-4 border-teal-500/30 bg-teal-50/80 flex items-center justify-center relative animate-in zoom-in-75 duration-300 shadow-md shadow-teal-500/10">
              <svg
                className="w-10 h-10 text-[#2A7B76]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Title and Tag */}
        <div className="space-y-1">
          <div className="inline-block mb-1">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
              {config.badgeText}
            </span>
          </div>
          <h3 className="font-serif font-bold text-lg sm:text-xl text-stone-900 leading-tight">
            {title}
          </h3>
        </div>

        {/* Message */}
        <div className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed px-2 break-words max-h-48 overflow-y-auto">
          {toast.message}
        </div>

        {/* Confirmation Button */}
        <div className="pt-2 w-full">
          <button
            type="button"
            onClick={onDismiss}
            className={`w-full py-3 px-6 rounded-2xl font-extrabold text-xs tracking-wide shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${config.btnColor}`}
          >
            <span>{config.btnText}</span>
          </button>
        </div>

        {/* Auto-Dismiss Countdown Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${config.progressBarBg}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
