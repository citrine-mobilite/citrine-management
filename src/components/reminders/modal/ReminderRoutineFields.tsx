import React from 'react';
import { Calendar, Clock, MapPin, BellRing, Smartphone, Repeat } from 'lucide-react';
import { ReminderRecurrenceMode, ReminderRoutineType } from '../../../types';
import {
  ROUTINE_PRESETS,
  ROUTINE_TYPE_META,
  WEEKDAY_OPTIONS,
} from '../../../services/reminderService';
import { AVAILABLE_PERIODS } from './useReminderModalLogic';

interface ReminderRoutineFieldsProps {
  isEditing: boolean;
  routineType: ReminderRoutineType;
  setRoutineType: (v: ReminderRoutineType) => void;
  title: string;
  setTitle: (v: string) => void;
  location: string;
  setLocation: (v: string) => void;
  recurrenceMode: ReminderRecurrenceMode;
  setRecurrenceMode: (v: ReminderRecurrenceMode) => void;
  recurrenceDays: number[];
  setRecurrenceDays: (days: number[]) => void;
  onToggleRecurrenceDay: (day: number) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  selectedPeriods: string[];
  onTogglePeriod: (id: string) => void;
  sendPushNotification: boolean;
  setSendPushNotification: (v: boolean) => void;
  enableSoundAlarm: boolean;
  setEnableSoundAlarm: (v: boolean) => void;
  selectedRoutinePresetId: string | null;
  onApplyRoutinePreset: (presetId: string) => void;
}

export const ReminderRoutineFields: React.FC<ReminderRoutineFieldsProps> = ({
  isEditing,
  routineType,
  setRoutineType,
  title,
  setTitle,
  location,
  setLocation,
  recurrenceMode,
  setRecurrenceMode,
  recurrenceDays,
  setRecurrenceDays,
  onToggleRecurrenceDay,
  date,
  setDate,
  time,
  setTime,
  note,
  setNote,
  selectedPeriods,
  onTogglePeriod,
  sendPushNotification,
  setSendPushNotification,
  enableSoundAlarm,
  setEnableSoundAlarm,
  selectedRoutinePresetId,
  onApplyRoutinePreset,
}) => {
  const currentMeta = ROUTINE_TYPE_META[routineType];

  return (
    <div className="space-y-4">
      {!isEditing && (
        <div className="space-y-2 p-3 rounded-2xl bg-stone-50/90 border border-stone-200/80">
          <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
            Modèles rapides de rituels
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ROUTINE_PRESETS.map((preset) => {
              const active = selectedRoutinePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyRoutinePreset(preset.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#2A7B76] border-[#2A7B76] text-white shadow-2xs'
                      : 'border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#2A7B76] text-stone-700'
                  }`}
                >
                  + {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-stone-700 mb-1">Nature du rappel *</label>
          <select
            value={routineType}
            onChange={(e) => setRoutineType(e.target.value as ReminderRoutineType)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
          >
            {(Object.keys(ROUTINE_TYPE_META) as ReminderRoutineType[]).map((key) => (
              <option key={key} value={key}>
                {ROUTINE_TYPE_META[key].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#2A7B76]" />
            Lieu ou lien visio (optionnel)
          </label>
          <input
            type="text"
            placeholder="Ex: Salle de réunion / Google Meet"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-stone-700 mb-1">Titre du rappel *</label>
        <input
          type="text"
          required
          placeholder={currentMeta.placeholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
        />
      </div>

      {/* Récurrence & Horaire */}
      <div className="p-4 rounded-2xl bg-stone-50/90 border border-stone-200/80 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Repeat className="h-3.5 w-3.5 text-[#2A7B76]" />
              Fréquence *
            </label>
            <select
              value={recurrenceMode}
              onChange={(e) => setRecurrenceMode(e.target.value as ReminderRecurrenceMode)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-semibold text-stone-900 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            >
              <option value="weekly_days">Jours précis de la semaine (ex: Lun, Mer, Ven)</option>
              <option value="weekdays">Jours ouvrés (Lundi au Vendredi)</option>
              <option value="daily">Tous les jours</option>
              <option value="monthly">Une fois par mois (Jour J uniquement)</option>
              <option value="once">Une seule fois (Jour J uniquement — sans alerte en avance)</option>
            </select>
            <p className="text-[11px] text-stone-500 mt-1.5">
              Un rappel de ce module ne s&apos;affiche et ne sonne que le jour prévu (Jour J). Pour être prévenu plusieurs jours à l&apos;avance (ex: J-7), utilisez le module Échéances &amp; Documents.
            </p>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
              Heure *
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white font-mono tabular-nums font-bold text-stone-900 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>
        </div>

        {recurrenceMode === 'weekly_days' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-stone-700">Jours de répétition :</span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setRecurrenceDays([1, 3, 5])}
                  className="px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:border-[#2A7B76] text-stone-700 font-semibold cursor-pointer"
                >
                  Lun · Mer · Ven
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceDays([2, 4])}
                  className="px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:border-[#2A7B76] text-stone-700 font-semibold cursor-pointer"
                >
                  Mar · Jeu
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceDays([1, 2, 3, 4, 5])}
                  className="px-2 py-0.5 rounded-md bg-white border border-stone-200 hover:border-[#2A7B76] text-stone-700 font-semibold cursor-pointer"
                >
                  Lun → Ven
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_OPTIONS.map((item) => {
                const selected = recurrenceDays.includes(item.day);
                return (
                  <button
                    key={item.day}
                    type="button"
                    onClick={() => onToggleRecurrenceDay(item.day)}
                    className={`py-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                      selected
                        ? 'bg-[#2A7B76] text-white border-[#2A7B76] shadow-2xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                    title={item.label}
                  >
                    {item.short}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(recurrenceMode === 'once' || recurrenceMode === 'monthly') && (
          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              {recurrenceMode === 'monthly' ? 'Date de référence (jour du mois) *' : 'Date prévue *'}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-1/2 px-3 py-2 rounded-xl border border-stone-200 bg-white font-mono tabular-nums font-semibold text-stone-900 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>
        )}
      </div>

      {/* Rappels anticipés */}
      <div className="space-y-2">
        <label className="block font-bold text-stone-800">Déclencher le rappel :</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AVAILABLE_PERIODS.map((period) => {
            const isChecked = selectedPeriods.includes(period.id);
            return (
              <button
                key={period.id}
                type="button"
                onClick={() => onTogglePeriod(period.id)}
                className={`p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition text-center ${
                  isChecked
                    ? 'bg-[#2A7B76] text-white border-[#2A7B76]'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                {period.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canaux de notification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <label className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-stone-200 bg-stone-50/70 cursor-pointer">
          <div className="flex items-center gap-2 min-w-0">
            <Smartphone className="h-4 w-4 text-[#2A7B76] shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-stone-800 block">Notification Push</span>
              <span className="text-[10px] text-stone-500 block">
                Reçue même si l&apos;app est fermée
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={sendPushNotification}
            onChange={(e) => setSendPushNotification(e.target.checked)}
            className="h-4 w-4 rounded text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer shrink-0"
          />
        </label>

        <label className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-stone-200 bg-stone-50/70 cursor-pointer">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-stone-800 block">Sonnerie dans l&apos;app</span>
              <span className="text-[10px] text-stone-500 block">
                Alerte sonore si l&apos;app est ouverte
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={enableSoundAlarm}
            onChange={(e) => setEnableSoundAlarm(e.target.checked)}
            className="h-4 w-4 rounded text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer shrink-0"
          />
        </label>
      </div>

      <div>
        <label className="block font-bold text-stone-700 mb-1">
          Consignes ou ordre du jour (optionnel)
        </label>
        <textarea
          rows={2}
          placeholder="Ex: Préparer l'avancement des tâches avant la réunion de 09h..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800"
        />
      </div>
    </div>
  );
};
