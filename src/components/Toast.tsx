import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

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

export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full px-3 sm:px-0 pointer-events-none"
      role="region"
      aria-label="Notifications système"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration || 4500;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  const type = toast.type || 'success';

  const config = {
    success: {
      icon: CheckCircle2,
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      badgeTag: 'Confirmé',
      tagBg: 'bg-emerald-100 text-emerald-800',
      leftBar: 'bg-emerald-500',
      progressBarBg: 'bg-emerald-500',
      defaultTitle: 'Validation confirmée',
      border: 'border-emerald-200/90 hover:border-emerald-300',
      accentGlow: 'shadow-emerald-950/10 ring-1 ring-emerald-500/10',
    },
    error: {
      icon: AlertCircle,
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      badgeTag: 'Erreur',
      tagBg: 'bg-rose-100 text-rose-800',
      leftBar: 'bg-rose-500',
      progressBarBg: 'bg-rose-500',
      defaultTitle: 'Attention requise',
      border: 'border-rose-200/90 hover:border-rose-300',
      accentGlow: 'shadow-rose-950/10 ring-1 ring-rose-500/10',
    },
    warning: {
      icon: AlertTriangle,
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
      badgeTag: 'Avertissement',
      tagBg: 'bg-amber-100 text-amber-800',
      leftBar: 'bg-amber-500',
      progressBarBg: 'bg-amber-500',
      defaultTitle: 'Information importante',
      border: 'border-amber-200/90 hover:border-amber-300',
      accentGlow: 'shadow-amber-950/10 ring-1 ring-amber-500/10',
    },
    info: {
      icon: Info,
      badgeBg: 'bg-teal-50 text-[#2A7B76] border-teal-200/80',
      badgeTag: 'Système',
      tagBg: 'bg-teal-100 text-[#2A7B76]',
      leftBar: 'bg-[#2A7B76]',
      progressBarBg: 'bg-[#2A7B76]',
      defaultTitle: 'Notification Citrine',
      border: 'border-stone-200/90 hover:border-stone-300',
      accentGlow: 'shadow-stone-900/10 ring-1 ring-teal-500/10',
    },
  }[type];

  const IconComponent = config.icon;
  const title = toast.title || config.defaultTitle;

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden bg-white/98 backdrop-blur-md text-stone-900 rounded-2xl border shadow-xl ${config.border} ${config.accentGlow} p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-3 flex items-start gap-3.5`}
      role="alert"
    >
      {/* Accent left line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.leftBar}`} />

      {/* Semantic Icon Badge */}
      <div className={`p-2 rounded-xl shrink-0 border ${config.badgeBg} shadow-2xs`}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Main Toast Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 leading-tight">
            {title}
          </h4>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${config.tagBg}`}>
            {config.badgeTag}
          </span>
        </div>
        <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed break-words font-medium">
          {toast.message}
        </p>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-colors shrink-0 cursor-pointer active:scale-90"
        aria-label="Fermer la notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress countdown bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-100 overflow-hidden">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${config.progressBarBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
