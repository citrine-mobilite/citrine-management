import React from 'react';
import {
  Bell,
  Clock,
  Trash2,
  Edit3,
  Users,
  Volume2,
  VolumeX,
  BellRing,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { Reminder } from '../../types';
import {
  RENEWAL_CYCLE_LABELS,
  computeReminderUrgency,
  formatDeadlineFrenchDate,
  getReminderCategoryLabel,
} from '../../services/reminderService';

interface ReminderItemCardProps {
  reminder: Reminder;
  isRinging?: boolean;
  onStartAlarm: (reminder: Reminder) => void;
  onStopAlarm: (reminder: Reminder) => void;
  onRenewOrResolve?: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export const ReminderItemCard: React.FC<ReminderItemCardProps> = ({
  reminder,
  isRinging = false,
  onStartAlarm,
  onStopAlarm,
  onRenewOrResolve,
  onEdit,
  onDelete,
}) => {
  const title = reminder.title || reminder.note || 'Échéance planifiée';
  const showNote = reminder.title && reminder.note && reminder.title !== reminder.note;
  const urgency = computeReminderUrgency(reminder);
  const cycle = reminder.renewalCycle || 'none';
  const isRecurring = cycle !== 'none';
  const hasSound = Boolean(reminder.time && reminder.time.trim().length > 0);

  const isExpiredOrCritical = urgency.level === 'expired' || urgency.level === 'critical';
  const isWarning = urgency.level === 'warning';
  const isResolved = urgency.level === 'resolved';

  return (
    <div
      className={`p-4 rounded-3xl border transition-all space-y-3 ${
        isRinging
          ? 'bg-rose-50/90 border-rose-300 shadow-md ring-2 ring-rose-500/40'
          : isExpiredOrCritical
          ? 'bg-white border-rose-200 shadow-2xs hover:shadow-md'
          : isWarning
          ? 'bg-white border-amber-200 shadow-2xs hover:shadow-md'
          : isResolved
          ? 'bg-stone-50/70 border-stone-200/80 opacity-85'
          : 'bg-white border-stone-200/80 shadow-2xs hover:shadow-md'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                isRinging
                  ? 'bg-rose-600 text-white border-rose-600'
                  : isExpiredOrCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isWarning
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isResolved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-emerald-50 text-[#2A7B76] border-emerald-200/60'
              }`}
            >
              {isRinging ? (
                <BellRing className="h-4 w-4" />
              ) : isExpiredOrCritical ? (
                <AlertOctagon className="h-4 w-4" />
              ) : isWarning ? (
                <AlertTriangle className="h-4 w-4" />
              ) : isResolved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
            </span>

            <h4 className="font-bold text-xs text-stone-900 truncate">
              {title}
              {reminder.entityName && (
                <span className="font-medium text-stone-500"> — {reminder.entityName}</span>
              )}
            </h4>

            <span
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold font-mono tabular-nums ${
                isExpiredOrCritical
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : isWarning
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : isResolved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              {urgency.statusLabel}
            </span>
          </div>

          {showNote && (
            <p className="text-[11px] text-stone-500 pl-9 line-clamp-2">{reminder.note}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 pl-9 sm:pl-0">
          {onRenewOrResolve && !isResolved && (
            <button
              type="button"
              onClick={() => onRenewOrResolve(reminder)}
              className="px-3 py-1.5 rounded-xl bg-[#2A7B76] hover:bg-[#226763] text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title={
                isRecurring
                  ? 'Valider et reporter à la prochaine période'
                  : 'Marquer comme validé'
              }
            >
              {isRecurring ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Marquer renouvelé</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Valider</span>
                </>
              )}
            </button>
          )}

          {isRinging ? (
            <button
              type="button"
              onClick={() => onStopAlarm(reminder)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Arrêter la sonnerie en cours"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Stop</span>
            </button>
          ) : (
            hasSound && (
              <button
                type="button"
                onClick={() => onStartAlarm(reminder)}
                className="p-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:text-[#2A7B76] text-stone-600 transition cursor-pointer"
                title="Tester la sonnerie"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onEdit(reminder)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 transition cursor-pointer"
            title="Modifier l'échéance"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Supprimer l'échéance"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
        <span className="bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60 font-semibold text-stone-700">
          {getReminderCategoryLabel(reminder.category)} · {RENEWAL_CYCLE_LABELS[cycle]}
        </span>

        {urgency.targetDateStr && (
          <div className="flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60 font-mono tabular-nums font-medium text-stone-700">
            <Calendar className="h-3 w-3 text-stone-400" />
            <span>
              Échéance {formatDeadlineFrenchDate(urgency.targetDateStr)}
              {reminder.time ? ` · ${reminder.time}` : ''}
            </span>
          </div>
        )}

        <span className="bg-amber-50/70 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200/60 font-mono tabular-nums font-bold text-[10px]">
          Alerte accueil J-{urgency.leadDays}
        </span>

        {reminder.documentRef && (
          <span className="font-mono text-[10px] text-stone-500">
            Réf. {reminder.documentRef}
          </span>
        )}

        <div className="flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60 text-stone-600 text-[10px] font-medium ml-auto">
          <Users className="h-3 w-3 text-stone-400" />
          <span>
            {reminder.allEmployees
              ? "Toute l'entreprise"
              : `${reminder.employeeIds?.length || 1} destinataire(s)`}
          </span>
        </div>
      </div>
    </div>
  );
};
