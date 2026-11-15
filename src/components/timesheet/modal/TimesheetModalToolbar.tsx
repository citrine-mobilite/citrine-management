import React from 'react';
import { X, Calendar, Download, Printer, FileSpreadsheet } from 'lucide-react';
import { Employee } from '../../../types';

interface TimesheetModalToolbarProps {
  employee: Employee;
  mode: 'day' | 'month' | 'year';
  onChangeMode: (mode: 'day' | 'month' | 'year') => void;
  selectedDate: string;
  onChangeDate: (date: string) => void;
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  selectedYear: number;
  onChangeYear: (year: number) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onClose: () => void;
}

export const TimesheetModalToolbar: React.FC<TimesheetModalToolbarProps> = ({
  employee,
  mode,
  onChangeMode,
  selectedDate,
  onChangeDate,
  selectedMonth,
  onChangeMonth,
  selectedYear,
  onChangeYear,
  onExportExcel,
  onExportPdf,
  onClose,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950 via-[#2A7B76] to-[#164e4b] p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <FileSpreadsheet className="h-5 w-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-emerald-100">
                Modèle Officiel Citrine
              </span>
              <span className="text-[10px] text-emerald-200 font-medium">
                {employee.name} • {employee.department || 'Général'}
              </span>
            </div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-white">
              Feuille de Tâches &amp; Synthèse du Rendement
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportExcel}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Exporter sous format Excel (.xls)"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel (.xls)</span>
          </button>
          <button
            onClick={onExportPdf}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-white/20"
            title="Imprimer ou exporter en PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer ml-1"
            title="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
        <div className="flex items-center gap-1 bg-stone-200/80 p-1 rounded-xl">
          <button
            onClick={() => onChangeMode('day')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              mode === 'day' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            📅 Plan du Jour (Journalier)
          </button>
          <button
            onClick={() => onChangeMode('month')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              mode === 'month' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🗓️ Synthèse Mensuelle
          </button>
          <button
            onClick={() => onChangeMode('year')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              mode === 'year' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🏆 Bilan Annuel
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'day' && (
            <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span className="font-semibold text-stone-600">Date :</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onChangeDate(e.target.value)}
                className="font-mono font-bold text-stone-900 outline-none text-xs"
              />
            </div>
          )}

          {mode === 'month' && (
            <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span className="font-semibold text-stone-600">Mois :</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => onChangeMonth(e.target.value)}
                className="font-mono font-bold text-stone-900 outline-none text-xs"
              />
            </div>
          )}

          {mode === 'year' && (
            <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span className="font-semibold text-stone-600">Année :</span>
              <select
                value={selectedYear}
                onChange={(e) => onChangeYear(Number(e.target.value))}
                className="font-mono font-bold text-stone-900 outline-none text-xs"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
