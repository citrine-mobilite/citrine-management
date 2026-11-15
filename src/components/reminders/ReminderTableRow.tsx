import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  RefreshCw,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Reminder, Employee } from '../../types';
import {
  RENEWAL_CYCLE_LABELS,
  computeReminderUrgency,
  formatDeadlineFrenchDate,
  getReminderCategoryLabel,
} from '../../services/reminderService';
import { getReminderTargetLabel } from './reminderTableHelpers';

interface ReminderTableRowProps {
  reminder: Reminder;
  employees: Employee[];
  isRinging: boolean;
  onStartAlarm: (reminder: Reminder) => void;
  onStopAlarm: (reminder: Reminder) => void;
  onRenewOrResolve?: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export const ReminderTableRow: React.FC<ReminderTableRowProps> = ({
  reminder,
  employees,
  isRinging,
  onStartAlarm,
  onStopAlarm,
  onRenewOrResolve,
  onEdit,
  onDelete,
}) => {
  const title = reminder.title || reminder.note || 'Échéance planifiée';
  const urgency = computeReminderUrgency(reminder);
  const cycle = reminder.renewalCycle || 'none';
  const isRecurring = cycle !== 'none';
  const hasSound = Boolean(reminder.time && reminder.time.trim().length > 0);

  return (
    <tr
      className={`transition ${
        isRinging ? 'bg-rose-50/90' : 'hover:bg-stone-50/80'
      }`}
    >
      <td className="py-3.5 px-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold font-mono tabular-nums ${
            urgency.level === 'expired' || urgency.level === 'critical'
              ? 'text-rose-700'
              : urgency.level === 'warning'
              ? 'text-amber-700'
              : urgency.level === 'resolved'
              ? 'text-emerald-700'
              : 'text-stone-600'
          }`}
        >
          {urgency.level === 'expired' || urgency.level === 'critical' ? (
            <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
          ) : urgency.level === 'warning' ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          ) : urgency.level === 'resolved' ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Clock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
          )}
          <span>{urgency.statusLabel}</span>
        </span>
      </td>

      <td className="py-3.5 px-4 min-w-[220px]">
        <div className="space-y-0.5">
          <div className="font-bold text-stone-900">
            {title}
            {reminder.entityName && (
              <span className="font-medium text-stone-500">
                {' '}
                — {reminder.entityName}
              </span>
            )}
          </div>
          {(reminder.note || reminder.documentRef) && (
            <p className="text-[11px] text-stone-500 line-clamp-1">
              {reminder.documentRef ? `Réf. ${reminder.documentRef} · ` : ''}
              {reminder.note}
            </p>
          )}
        </div>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-stone-600">
        <div className="font-semibold text-stone-800">
          {getReminderCategoryLabel(reminder.category)}
        </div>
        <div className="text-stone-500">{RENEWAL_CYCLE_LABELS[cycle]}</div>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono tabular-nums text-stone-700">
        <div className="font-semibold">
          {urgency.targetDateStr
            ? formatDeadlineFrenchDate(urgency.targetDateStr)
            : 'Non datée'}
          {reminder.time ? ` · ${reminder.time}` : ''}
        </div>
        <div className="text-stone-400">Alerte J-{urgency.leadDays}</div>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-stone-600">
        {getReminderTargetLabel(reminder, employees)}
      </td>

      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {onRenewOrResolve && urgency.level !== 'resolved' && (
            <button
              type="button"
              onClick={() => onRenewOrResolve(reminder)}
              className="px-2.5 py-1.5 rounded-xl bg-[#2A7B76] hover:bg-[#226763] text-white font-bold text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
              title={
                isRecurring
                  ? 'Valider et planifier la prochaine période'
                  : 'Valider'
              }
            >
              {isRecurring ? (
                <>
                  <RefreshCw className="h-3 w-3" />
                  <span>Renouveler</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Valider</span>
                </>
              )}
            </button>
          )}

          {isRinging ? (
            <button
              type="button"
              onClick={() => onStopAlarm(reminder)}
              className="px-2 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
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
                <Volume2 className="h-3.5 w-3.5" />
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onEdit(reminder)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-[#2A7B76] hover:bg-stone-100 transition cursor-pointer"
            title="Modifier"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
