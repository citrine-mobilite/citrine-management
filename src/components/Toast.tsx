import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { key?: string; toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <div
      className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-xl border transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
        isSuccess
          ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30'
          : 'bg-green-600 text-white border-green-500 shadow-green-900/30'
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0 text-emerald-100" />
        ) : (
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-100" />
        )}
        <div>
          <h4 className="font-semibold text-sm leading-tight text-white">
            {isSuccess ? 'Opération réussie' : 'Erreur ou Échec'}
          </h4>
          <p className="text-xs text-white/95 mt-1 font-medium">{toast.message}</p>
        </div>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-2 shrink-0"
        aria-label="Fermer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
