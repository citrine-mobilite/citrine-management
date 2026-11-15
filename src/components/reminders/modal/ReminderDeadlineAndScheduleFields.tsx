import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { ReminderCategory, ReminderKind, ReminderRenewalCycle } from '../../../types';
import { REMINDER_CATEGORY_META } from '../../../services/reminderService';
import { ReminderSoundAlarmFields } from './ReminderSoundAlarmFields';
import { ReminderDeadlineTimingFields } from './ReminderDeadlineTimingFields';

interface ReminderDeadlineAndScheduleFieldsProps {
  kind: ReminderKind;
  category: ReminderCategory;
  setCategory: (v: ReminderCategory) => void;
  title: string;
  setTitle: (v: string) => void;
  entityName: string;
  setEntityName: (v: string) => void;
  documentRef: string;
  setDocumentRef: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  renewalCycle: ReminderRenewalCycle;
  setRenewalCycle: (v: ReminderRenewalCycle) => void;
  alertLeadDays: number;
  setAlertLeadDays: (v: number) => void;
  note: string;
  setNote: (v: string) => void;
  enableSoundAlarm: boolean;
  setEnableSoundAlarm: (v: boolean) => void;
  time: string;
  setTime: (v: string) => void;
  selectedPeriods: string[];
  onTogglePeriod: (id: string) => void;
}

export const ReminderDeadlineAndScheduleFields: React.FC<ReminderDeadlineAndScheduleFieldsProps> = ({
  kind,
  category,
  setCategory,
  title,
  setTitle,
  entityName,
  setEntityName,
  documentRef,
  setDocumentRef,
  date,
  setDate,
  renewalCycle,
  setRenewalCycle,
  alertLeadDays,
  setAlertLeadDays,
  note,
  setNote,
  enableSoundAlarm,
  setEnableSoundAlarm,
  time,
  setTime,
  selectedPeriods,
  onTogglePeriod,
}) => {
  const currentCatMeta = REMINDER_CATEGORY_META[category];

  return (
    <>
      {kind === 'deadline' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Catégorie *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReminderCategory)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            >
              {(Object.keys(REMINDER_CATEGORY_META) as ReminderCategory[]).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {REMINDER_CATEGORY_META[catKey].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Élément concerné (véhicule, organisme…)
            </label>
            <input
              type="text"
              placeholder={currentCatMeta.placeholderEntity}
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={kind === 'deadline' ? 'sm:col-span-2' : 'sm:col-span-3'}>
          <label className="block font-bold text-stone-700 mb-1">
            {kind === 'deadline' ? 'Document ou obligation *' : "Titre de l'alerte *"}
          </label>
          <input
            type="text"
            required
            placeholder={
              kind === 'deadline'
                ? 'Ex: Carte grise, Visite technique, Impôts trimestriels…'
                : "Ex: Clôture paie mensuelle, Point d'étape..."
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        {kind === 'deadline' && (
          <div>
            <label className="block font-bold text-stone-700 mb-1">N° / Référence</label>
            <input
              type="text"
              placeholder="Ex: CG-2026-09"
              value={documentRef}
              onChange={(e) => setDocumentRef(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>
        )}
      </div>

      {kind === 'deadline' ? (
        <ReminderDeadlineTimingFields
          date={date}
          setDate={setDate}
          renewalCycle={renewalCycle}
          setRenewalCycle={setRenewalCycle}
          alertLeadDays={alertLeadDays}
          setAlertLeadDays={setAlertLeadDays}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              Date de rappel *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono tabular-nums font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
              Heure de rappel *
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono tabular-nums font-medium"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block font-bold text-stone-700 mb-1">
          {kind === 'deadline' ? 'Consignes / Pièces à préparer' : "Détail de l'alerte *"}
        </label>
        <textarea
          required={kind === 'alarm'}
          rows={2}
          placeholder={
            kind === 'deadline'
              ? 'Ex: Contacter le transitaire ou préparer le chèque trésor...'
              : 'Spécifications, consignes détaillées, ordre du jour...'
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800"
        />
      </div>

      <ReminderSoundAlarmFields
        kind={kind}
        alertLeadDays={alertLeadDays}
        enableSoundAlarm={enableSoundAlarm}
        setEnableSoundAlarm={setEnableSoundAlarm}
        time={time}
        setTime={setTime}
        selectedPeriods={selectedPeriods}
        onTogglePeriod={onTogglePeriod}
      />
    </>
  );
};
