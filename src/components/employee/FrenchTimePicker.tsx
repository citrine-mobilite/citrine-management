import React from 'react';
import { SearchableSelect } from '../common/SearchableSelect';

export interface FrenchTimePickerProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  id?: string;
}

export default function FrenchTimePicker({ value, onChange, className = "", id }: FrenchTimePickerProps) {
  let initialHour = "";
  let initialMin = "";
  
  if (value && value.includes(":")) {
    const parts = value.split(":");
    initialHour = parts[0] || "";
    initialMin = parts[1] || "";
  }

  const pad = (num: number) => num.toString().padStart(2, '0');

  const hoursList = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutesList = Array.from({ length: 60 }, (_, i) => pad(i));

  const handleHourChange = (newH: string) => {
    if (!newH) {
      onChange("");
    } else {
      const currentM = initialMin || "00";
      onChange(`${newH}:${currentM}`);
    }
  };

  const handleMinChange = (newM: string) => {
    const currentH = initialHour || "08";
    const mValue = newM || "00";
    onChange(`${currentH}:${mValue}`);
  };

  return (
    <div className={`inline-flex items-center gap-1.5 bg-stone-50 border border-stone-200/80 rounded-xl px-2.5 py-1.5 justify-center ${className}`} id={id}>
      <div className="w-20">
        <SearchableSelect
          value={initialHour}
          onChange={(val) => handleHourChange(val)}
          placeholder="-- h"
          searchPlaceholder="Heure..."
          options={hoursList.map(h => ({ value: h, label: `${h}h` }))}
        />
      </div>
      <span className="text-stone-400 font-bold text-xs">:</span>
      <div className="w-22">
        <SearchableSelect
          value={initialMin}
          onChange={(val) => handleMinChange(val)}
          placeholder="-- min"
          searchPlaceholder="Min..."
          disabled={!initialHour}
          options={minutesList.map(m => ({ value: m, label: `${m} min` }))}
        />
      </div>
    </div>
  );
}
