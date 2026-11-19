import React from 'react';
import { 
  Bell, 
  Clock, 
  Trash2, 
  Edit3, 
  Users, 
  Volume2, 
  VolumeX, 
  Repeat, 
  BellRing 
} from 'lucide-react';
import { Reminder } from '../../types';

interface ReminderItemCardProps {
  reminder: Reminder;
  isRinging?: boolean;
  onStartAlarm: (reminder: Reminder) => void;
  onStopAlarm: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

const PERIOD_LABELS: Record<string, string> = {
  '1h': '1h avant',
  '30m': '30m avant',
  '15m': '15m avant',
  '5m': '5m avant',
  exact: 'Heure exacte',
};

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'Une seule fois',
  daily: 'Tous les jours',
  weekdays: 'Jours ouvrés',
  weekends: 'Week-ends',
};

export const ReminderItemCard: React.FC<ReminderItemCardProps> = ({
  reminder,
  isRinging = false,
  onStartAlarm,
  onStopAlarm,
  onEdit,
  onDelete,
}) => {
  const title = reminder.title || reminder.note || 'Alerte planifiée';
  const showNote = reminder.title && reminder.note && reminder.title !== reminder.note;

  return (
    <div
      className={`p-4 rounded-3xl border transition-all space-y-3 ${
        isRinging
          ? 'bg-rose-50/90 border-rose-300 shadow-md ring-2 ring-rose-500/40 animate-pulse'
          : 'bg-white border-stone-200/80 shadow-2xs hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Title and note */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                isRinging
                  ? 'bg-rose-600 text-white border-rose-600 animate-bounce'
                  : 'bg-emerald-50 text-[#2A7B76] border-emerald-200/60'
              }`}
            >
              {isRinging ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </span>
            <h4 className="font-bold text-xs text-stone-900 truncate">{title}</h4>
            {isRinging && (
              <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                Sonnerie active
              </span>
            )}
          </div>

          {showNote && (
            <p className="text-[11px] text-stone-500 pl-9 line-clamp-2">
              {reminder.note}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Continuous alarm toggle */}
          {isRinging ? (
            <button
              type="button"
              onClick={() => onStopAlarm(reminder)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Arrêter la sonnerie en cours"
            >
              <VolumeX className="h-3.5 w-3.5" />
              <span>Arrêter sonnerie</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onStartAlarm(reminder)}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:text-[#2A7B76] hover:border-emerald-200 text-stone-700 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer"
              title="Déclencher la sonnerie en continu (sonne jusqu'à arrêt)"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Faire sonner</span>
            </button>
          )}

          {/* Modifier */}
          <button
            type="button"
            onClick={() => onEdit(reminder)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 transition cursor-pointer"
            title="Modifier l'alerte"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          {/* Supprimer */}
          <button
            type="button"
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Supprimer l'alerte"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Meta tags & Multi-Alarm Trigger Periods */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 pt-2 border-t border-stone-100">
        {reminder.date && (
          <div className="flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60 font-medium">
            <Clock className="h-3 w-3 text-stone-400" />
            <span>
              {reminder.date} {reminder.time ? `à ${reminder.time}` : ''}
            </span>
          </div>
        )}

        {/* Multi-Alarm Periods */}
        {reminder.triggerPeriods && reminder.triggerPeriods.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-bold text-stone-400 uppercase">Réveils :</span>
            {reminder.triggerPeriods.map((period) => (
              <span
                key={period}
                className="bg-emerald-100/70 text-[#2A7B76] px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200/60"
              >
                {PERIOD_LABELS[period] || period}
              </span>
            ))}
          </div>
        )}

        {/* Recurrence */}
        {reminder.recurrence && (
          <div className="flex items-center gap-1 bg-stone-50 px-2 py-0.5 rounded-lg border border-stone-200/50 text-[10px]">
            <Repeat className="h-2.5 w-2.5 text-stone-400" />
            <span>{RECURRENCE_LABELS[reminder.recurrence] || reminder.recurrence}</span>
          </div>
        )}

        {/* Target Recipients */}
        <div className="flex items-center gap-1 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60 text-stone-600 text-[10px] font-medium ml-auto">
          <Users className="h-3 w-3 text-stone-400" />
          <span>
            {reminder.allEmployees
              ? 'Tous les collaborateurs'
              : `${reminder.employeeIds?.length || 1} destinataire(s)`}
          </span>
        </div>
      </div>
    </div>
  );
};
