import React from 'react';
import { Bell, CheckCheck, ShieldAlert, X, ExternalLink, Trash2 } from 'lucide-react';
import { PersonalAlert, formatExactTimestamp } from './employeeAlertsTypes';

interface EmployeeAlertDetailModalProps {
  alert: PersonalAlert | null;
  onClose: () => void;
  onDelete: (id: string, e?: React.MouseEvent) => void;
}

export const EmployeeAlertDetailModal: React.FC<EmployeeAlertDetailModalProps> = ({
  alert,
  onClose,
  onDelete,
}) => {
  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${alert.type === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-[#2A7B76]'}`}>
              {alert.type === 'urgent' ? <ShieldAlert className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                {alert.category}
              </span>
              <h3 className="font-bold text-stone-900 text-sm mt-0.5">{alert.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Message complet</label>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 text-stone-800 text-xs leading-relaxed whitespace-pre-wrap">
              {alert.message}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
            <span>
              Reçu <strong className="text-stone-700 font-mono">{formatExactTimestamp(alert.timestamp)}</strong>
            </span>
            <span className="flex items-center gap-1 text-emerald-700 font-bold">
              <CheckCheck className="w-4 h-4" /> Lue et enregistrée
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={(e) => onDelete(alert.id, e)}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Supprimer</span>
          </button>

          <div className="flex items-center gap-2">
            {alert.actionUrl && (
              <a
                href={alert.actionUrl}
                onClick={onClose}
                className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20615d] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <span>Consulter l'élément</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
