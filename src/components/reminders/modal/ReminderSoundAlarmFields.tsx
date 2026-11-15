import React from 'react';
import { Clock } from 'lucide-react';
import { ReminderKind } from '../../../types';
import { AVAILABLE_PERIODS } from './useReminderModalLogic';

interface ReminderSoundAlarmFieldsProps {
  kind: ReminderKind;
  alertLeadDays: number;
  enableSoundAlarm: boolean;
  setEnableSoundAlarm: (v: boolean) => void;
  time: string;
  setTime: (v: string) => void;
  selectedPeriods: string[];
  onTogglePeriod: (id: string) => void;
}

export const ReminderSoundAlarmFields: React.FC<ReminderSoundAlarmFieldsProps> = ({
  kind,
  alertLeadDays,
  enableSoundAlarm,
  setEnableSoundAlarm,
  time,
  setTime,
  selectedPeriods,
  onTogglePeriod,
}) => {
  return (
    <>
      {kind === 'deadline' && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-stone-500" />
            <div>
              <span className="font-bold text-stone-800 block">
                Déclencher aussi une sonnerie le jour de l&apos;échéance
              </span>
              <span className="text-[10px] text-stone-500">
                Le message d&apos;accueil s&apos;affiche automatiquement dès J-{alertLeadDays}.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={enableSoundAlarm}
            onChange={(e) => setEnableSoundAlarm(e.target.checked)}
            className="h-4 w-4 rounded text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer"
          />
        </div>
      )}

      {(kind === 'alarm' || enableSoundAlarm) && (
        <div className="space-y-2.5 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
          {kind === 'deadline' && (
            <div className="flex items-center gap-3">
              <label className="font-bold text-stone-700">Heure de sonnerie :</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white font-mono tabular-nums font-semibold"
              />
            </div>
          )}
          <label className="block font-bold text-stone-800">Périodes de sonnerie</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_PERIODS.map((period) => {
              const isChecked = selectedPeriods.includes(period.id);
              return (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => onTogglePeriod(period.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition text-left ${
                    isChecked
                      ? 'bg-[#2A7B76] text-white border-[#2A7B76]'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <span>{period.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
