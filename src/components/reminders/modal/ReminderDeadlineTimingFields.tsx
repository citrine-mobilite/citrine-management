import React from 'react';
import { Calendar, Repeat, AlertTriangle } from 'lucide-react';
import { ReminderRenewalCycle } from '../../../types';
import {
  ALERT_LEAD_OPTIONS,
  RENEWAL_CYCLE_LABELS,
} from '../../../services/reminderService';

interface ReminderDeadlineTimingFieldsProps {
  date: string;
  setDate: (v: string) => void;
  renewalCycle: ReminderRenewalCycle;
  setRenewalCycle: (v: ReminderRenewalCycle) => void;
  alertLeadDays: number;
  setAlertLeadDays: (v: number) => void;
}

export const ReminderDeadlineTimingFields: React.FC<ReminderDeadlineTimingFieldsProps> = ({
  date,
  setDate,
  renewalCycle,
  setRenewalCycle,
  alertLeadDays,
  setAlertLeadDays,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/80">
      <div>
        <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
          Date d&apos;expiration *
        </label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono tabular-nums font-semibold"
        />
      </div>

      <div>
        <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
          <Repeat className="h-3.5 w-3.5 text-[#2A7B76]" />
          Renouvellement
        </label>
        <select
          value={renewalCycle}
          onChange={(e) => setRenewalCycle(e.target.value as ReminderRenewalCycle)}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-semibold text-stone-800"
        >
          {(Object.keys(RENEWAL_CYCLE_LABELS) as ReminderRenewalCycle[]).map((key) => (
            <option key={key} value={key}>
              {RENEWAL_CYCLE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          Alerte accueil
        </label>
        <select
          value={ALERT_LEAD_OPTIONS.some((o) => o.days === alertLeadDays) ? String(alertLeadDays) : 'custom'}
          onChange={(e) => {
            if (e.target.value !== 'custom') {
              setAlertLeadDays(Number(e.target.value));
            }
          }}
          className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-semibold text-stone-800"
        >
          {ALERT_LEAD_OPTIONS.map((opt) => (
            <option key={opt.days} value={String(opt.days)}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="text-[10px] text-stone-500">Précis (jours) :</span>
          <input
            type="number"
            min={1}
            max={180}
            value={alertLeadDays}
            onChange={(e) => setAlertLeadDays(Math.max(1, Number(e.target.value) || 7))}
            className="w-16 px-2 py-0.5 rounded-lg border border-stone-200 bg-white text-[11px] font-mono tabular-nums font-bold text-stone-800"
          />
        </div>
      </div>
    </div>
  );
};
