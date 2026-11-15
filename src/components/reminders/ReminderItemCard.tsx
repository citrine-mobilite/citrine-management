import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  Receipt,
  RefreshCw,
  Trash2,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Reminder, ReminderCategory } from '../../types';
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

const renderCategoryIcon = (category?: ReminderCategory, isRinging?: boolean) => {
  if (isRinging) return <BellRing className="h-4 w-4" />;
  switch (category) {
    case 'vehicule':
      return <Car className="h-4 w-4" />;
    case 'fiscalite':
      return <Receipt className="h-4 w-4" />;
    case 'administratif':
      return <FileText className="h-4 w-4" />;
    case 'rh':
      return <Users className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

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
  const hasSoundConfig = Boolean(reminder.time && reminder.time.trim().length > 0) || reminder.kind === 'alarm';

  const statusToneClass =
    urgency.level === 'expired' || urgency.level === 'critical'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : urgency.level === 'warning'
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : urgency.level === 'resolved'
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : 'text-stone-700 bg-stone-50 border-stone-200';

  return (
    <div
      className={`p-4 rounded-2xl border transition space-y-2.5 ${
        isRinging
          ? 'bg-rose-50/90 border-rose-300 shadow-sm ring-2 ring-rose-500/30 animate-pulse'
          : 'bg-white border-stone-200/85 hover:border-stone-300 shadow-2xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Left: Category icon + Title + Entity + Status */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isRinging
                ? 'bg-rose-600 text-white border-rose-600'
                : urgency.level === 'expired'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : urgency.level === 'warning' || urgency.level === 'critical'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}
          >
            {renderCategoryIcon(reminder.category, isRinging)}
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-stone-900 truncate">{title}</h4>
              {reminder.entityName && (
                <span className="text-xs font-medium text-stone-600 truncate">
                  — {reminder.entityName}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold font-mono tabular-nums ${statusToneClass}`}
              >
                {urgency.level === 'expired' || urgency.level === 'critical' ? (
                  <AlertOctagon className="h-3 w-3 shrink-0" />
                ) : urgency.level === 'warning' ? (
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                ) : urgency.level === 'resolved' ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                ) : (
                  <Clock className="h-3 w-3 shrink-0" />
                )}
                <span>{urgency.statusLabel}</span>
              </span>
            </div>

            {showNote && (
              <p className="text-xs text-stone-500 line-clamp-2">{reminder.note}</p>
            )}

            {/* Inline unboxed metadata */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-500 pt-0.5">
              <span className="font-semibold text-stone-700">
                {getReminderCategoryLabel(reminder.category)}
              </span>
              {reminder.documentRef && (
                <>
                  <span>·</span>
                  <span className="font-mono">Réf. {reminder.documentRef}</span>
                </>
              )}
              <span>·</span>
              <span>{RENEWAL_CYCLE_LABELS[cycle]}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums text-stone-700">
                <Calendar className="h-3 w-3 text-stone-400" />
                {urgency.targetDateStr
                  ? formatDeadlineFrenchDate(urgency.targetDateStr)
                  : 'Non datée'}
                {reminder.time ? ` à ${reminder.time}` : ''}
              </span>
              <span>·</span>
              <span className="font-mono tabular-nums">Alerte J-{urgency.leadDays}</span>
              <span>·</span>
              <span>
                {reminder.allEmployees
                  ? "Toute l'équipe"
                  : `${reminder.employeeIds?.length || 1} destinataire(s)`}
              </span>
              {reminder.lastRenewedAt && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-medium">
                    Validé le {formatDeadlineFrenchDate(reminder.lastRenewedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
          {onRenewOrResolve && urgency.level !== 'resolved' && (
            <button
              type="button"
              onClick={() => onRenewOrResolve(reminder)}
              className="px-3 py-1.5 rounded-xl bg-[#2A7B76] hover:bg-[#226763] text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title={
                isRecurring
                  ? "Valider et passer automatiquement à l'échéance suivante"
                  : 'Marquer ce document comme validé'
              }
            >
              {isRecurring ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Renouveler</span>
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
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Arrêter la sonnerie en cours"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Stop</span>
            </button>
          ) : (
            hasSoundConfig && (
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
            className="p-1.5 rounded-xl text-stone-400 hover:text-[#2A7B76] hover:bg-stone-100 transition cursor-pointer"
            title="Modifier"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Supprimer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
