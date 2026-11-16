import React from 'react';
import { X, Calendar, Download, FileText, FileSpreadsheet, Mail, Loader2 } from 'lucide-react';
import { Employee } from '../../../types';

interface TaskSheetModalToolbarProps {
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
  onSendEmail?: () => void;
  isSendingEmail?: boolean;
  onClose: () => void;
}

export const TaskSheetModalToolbar: React.FC<TaskSheetModalToolbarProps> = ({
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
  onSendEmail,
  isSendingEmail = false,
  onClose,
}) => {
  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950 via-[#2A7B76] to-[#164e4b] p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-2xl border border-white/20">
            <FileSpreadsheet className="h-5 w-5 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-white">
              Feuille de Tâches — {employee.name}
            </h3>
            <div className="text-[11px] text-emerald-200 font-medium">
              {employee.department || 'Général'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onSendEmail && (
            <button
              type="button"
              disabled={isSendingEmail}
              onClick={onSendEmail}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              {isSendingEmail ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="h-3.5 w-3.5" />
              )}
              <span>{isSendingEmail ? 'Envoi...' : 'Envoyer par mail'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportExcel}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Excel (.xls)</span>
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            className="px-3 py-1.5 bg-white text-[#164e4b] hover:bg-emerald-50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>
          <button
            type="button"
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
            type="button"
            onClick={() => onChangeMode('day')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              mode === 'day' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Plan du Jour
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('month')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              mode === 'month' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Synthèse Mensuelle
          </button>
          <button
            type="button"
            onClick={() => onChangeMode('year')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              mode === 'year' ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Bilan Annuel
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
