import React from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Edit3,
  MapPin,
  Pause,
  PhoneCall,
  Play,
  Repeat,
  Smartphone,
  Trash2,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Reminder, ReminderRoutineType } from '../../types';
import {
  ROUTINE_TYPE_META,
  WEEKDAY_OPTIONS,
  formatNextOccurrenceBadge,
  formatRoutineRecurrenceLabel,
  getActiveWeekdays,
  resolveRecurrenceMode,
} from '../../services/reminderService';

interface RoutineReminderCardProps {
  reminder: Reminder;
  isRinging?: boolean;
  onStartAlarm: (reminder: Reminder) => void;
  onStopAlarm: (reminder: Reminder) => void;
  onTogglePause: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

const renderRoutineIcon = (routineType?: ReminderRoutineType, isRinging?: boolean) => {
  if (isRinging) return <BellRing className="h-4 w-4" />;
  switch (routineType) {
    case 'reunion':
    case 'brief':
      return <Users className="h-4 w-4" />;
    case 'appel':
      return <PhoneCall className="h-4 w-4" />;
    case 'suivi':
      return <Repeat className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

export const RoutineReminderCard: React.FC<RoutineReminderCardProps> = ({
  reminder,
  isRinging = false,
  onStartAlarm,
  onStopAlarm,
  onTogglePause,
  onEdit,
  onDelete,
}) => {
  const isPaused = Boolean(reminder.stopped || reminder.isResolved);
  const mode = resolveRecurrenceMode(reminder);
  const activeDays = getActiveWeekdays(reminder);
  const recurrenceLabel = formatRoutineRecurrenceLabel(reminder);
  const nextBadge = formatNextOccurrenceBadge(reminder);
  const typeLabel =
    ROUTINE_TYPE_META[reminder.routineType || 'reunion']?.label || 'Rappel récurrent';
  const showWeekStrip = mode === 'weekly_days' || mode === 'weekdays' || mode === 'daily';
  const locationText = reminder.location || reminder.entityName;

  const badgeTone = isPaused
    ? 'text-stone-600 bg-stone-100 border-stone-200'
    : nextBadge.isSoon
    ? 'text-rose-700 bg-rose-50 border-rose-200'
    : nextBadge.isToday
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-emerald-800 bg-emerald-50 border-emerald-200';

  return (
    <div
      className={`p-4 rounded-2xl border transition space-y-2.5 ${
        isRinging
          ? 'bg-rose-50/90 border-rose-300 shadow-sm ring-2 ring-rose-500/30 animate-pulse'
          : isPaused
          ? 'bg-stone-50/70 border-stone-200/80 opacity-80'
          : 'bg-white border-stone-200/85 hover:border-stone-300 shadow-2xs'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              isRinging
                ? 'bg-rose-600 text-white border-rose-600'
                : isPaused
                ? 'bg-stone-100 text-stone-400 border-stone-200'
                : 'bg-emerald-50 text-[#2A7B76] border-emerald-200/70'
            }`}
          >
            {renderRoutineIcon(reminder.routineType, isRinging)}
          </span>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-sm text-stone-900 truncate">
                {reminder.title || reminder.note || 'Rappel récurrent'}
              </h4>
              <span className="text-[11px] font-semibold text-stone-500">{typeLabel}</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold font-mono tabular-nums ${badgeTone}`}
              >
                <Clock className="h-3 w-3 shrink-0" />
                <span>{nextBadge.label}</span>
              </span>
            </div>

            {reminder.note && reminder.note !== reminder.title && (
              <p className="text-xs text-stone-500 line-clamp-2">{reminder.note}</p>
            )}

            {showWeekStrip && (
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {WEEKDAY_OPTIONS.map((w) => {
                  const active = activeDays.includes(w.day);
                  return (
                    <span
                      key={w.day}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        active && !isPaused
                          ? 'bg-[#2A7B76] text-white border-[#2A7B76]'
                          : active && isPaused
                          ? 'bg-stone-300 text-white border-stone-300'
                          : 'bg-stone-50 text-stone-400 border-stone-200/70'
                      }`}
                    >
                      {w.short}
                    </span>
                  );
                })}
                {reminder.time && (
                  <span className="ml-1.5 text-[11px] font-mono tabular-nums font-bold text-stone-700">
                    à {reminder.time}
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-500 pt-0.5">
              <span className="font-semibold text-stone-700 inline-flex items-center gap-1">
                <Repeat className="h-3 w-3 text-[#2A7B76]" />
                {recurrenceLabel}
              </span>
              {locationText && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-stone-600">
                    <MapPin className="h-3 w-3 text-stone-400" />
                    {locationText}
                  </span>
                </>
              )}
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Smartphone className="h-3 w-3 text-stone-400" />
                {reminder.sendPushNotification !== false ? 'Push actif' : 'Sans Push'}
              </span>
              <span>·</span>
              <span>
                {reminder.allEmployees
                  ? "Toute l'équipe"
                  : `${reminder.employeeIds?.length || 1} destinataire(s)`}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
          <button
            type="button"
            onClick={() => onTogglePause(reminder)}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer border ${
              isPaused
                ? 'bg-[#2A7B76] hover:bg-[#226763] text-white border-[#2A7B76]'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
            title={isPaused ? 'Réactiver ce rappel' : 'Mettre en pause temporairement'}
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Reprendre</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pause</span>
              </>
            )}
          </button>

          {isRinging ? (
            <button
              type="button"
              onClick={() => onStopAlarm(reminder)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
              title="Arrêter la sonnerie"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Stop</span>
            </button>
          ) : (
            reminder.enableSoundAlarm !== false && (
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
