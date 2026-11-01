import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

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
 * Remplacement définitif des Toasts par les SweetAlerts :
 * Aucun toast n'est affiché. Les retours applicatifs utilisent exclusivement
 * le flux officiel : Loader synchrone -> Disparition du loader -> SweetAlert (Succès, Échec ou En attente).
 */
export default function ToastContainer(_props?: ToastProps) {
  return null;
}

const ToastItem: React.FC<{
  toast: ToastMessage;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  const duration = toast.duration || (toast.type === 'error' ? 6000 : 3500);
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
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const type = toast.type || 'info';

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-[#2A7B76] shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-white/95 text-stone-800',
    error: 'border-rose-200 bg-white/95 text-stone-800',
    warning: 'border-amber-200 bg-white/95 text-stone-800',
    info: 'border-stone-200 bg-white/95 text-stone-800',
  };

  const progressColors = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-[#2A7B76]',
  };

  return (
    <div
      role="status"
      className={`pointer-events-auto rounded-2xl border shadow-xl backdrop-blur-md p-3.5 pr-8 relative overflow-hidden transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in ${borders[type]}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-serif font-bold text-xs text-stone-900 leading-snug truncate">
              {toast.title}
            </h4>
          )}
          <p className="text-[11px] text-stone-600 leading-relaxed mt-0.5 line-clamp-2">
            {toast.message}
          </p>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
        title="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100/70 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${progressColors[type]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
