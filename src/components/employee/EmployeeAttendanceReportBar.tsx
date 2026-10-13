import React, { useMemo } from 'react';
import { FileText, Calendar, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SearchableSelect } from '../common/SearchableSelect';

interface EmployeeAttendanceReportBarProps {
  portalReportMonth: string;
  setPortalReportMonth: (month: string) => void;
  handleGeneratePortalReport: (month?: string) => void;
  isGeneratingReport: boolean;
}

// Mois de référence initial des pointages : Octobre 2026
const START_YEAR = 2026;
const START_MONTH = 10; // Octobre 2026

export const EmployeeAttendanceReportBar: React.FC<EmployeeAttendanceReportBarProps> = ({
  portalReportMonth,
  setPortalReportMonth,
  handleGeneratePortalReport,
  isGeneratingReport,
}) => {
  // Générer la liste des mois sélectionnables à partir d'Octobre 2026
  const availableMonths = useMemo(() => {
    const list: { value: string; label: string; isStartMonth?: boolean }[] = [];
    const now = new Date();
    // Génère au moins jusqu'à décembre de l'année suivante ou date actuelle
    const endYear = Math.max(now.getFullYear(), 2027);
    const endMonth = endYear === 2026 ? Math.max(now.getMonth() + 3, 12) : 12;

    for (let y = START_YEAR; y <= endYear; y++) {
      const mStart = y === START_YEAR ? START_MONTH : 1;
      const mEnd = y === endYear ? endMonth : 12;
      for (let m = mStart; m <= mEnd; m++) {
        const value = `${y}-${String(m).padStart(2, '0')}`;
        const d = new Date(y, m - 1, 1);
        const monthName = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const label = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        list.push({
          value,
          label: value === '2026-10' ? `${label} (Début des pointages)` : label,
          isStartMonth: value === '2026-10',
        });
      }
    }
    return list;
  }, []);

  const currentMonthValue = portalReportMonth < '2026-10' ? '2026-10' : portalReportMonth;

  const handlePrevMonth = () => {
    const [yStr, mStr] = currentMonthValue.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y--;
    }
    const prevVal = `${y}-${String(m).padStart(2, '0')}`;
    if (prevVal >= '2026-10') {
      setPortalReportMonth(prevVal);
    }
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = currentMonthValue.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y++;
    }
    const nextVal = `${y}-${String(m).padStart(2, '0')}`;
    setPortalReportMonth(nextVal);
  };

  const isAtStartMonth = currentMonthValue === '2026-10';

  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-3xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
      {/* Month selection group */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <div className="flex items-center gap-1.5 text-stone-700 font-bold">
          <Calendar className="h-4 w-4 text-[#2A7B76]" />
          <span>Fiche mensuelle :</span>
        </div>

        {/* Quick Month Switcher with prev/next */}
        <div className="inline-flex items-center bg-stone-50 border border-stone-200 rounded-xl p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isAtStartMonth}
            className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-30 disabled:hover:text-stone-600 rounded-lg hover:bg-stone-200/60 transition cursor-pointer"
            title={isAtStartMonth ? "Début des pointages atteint (Octobre 2026)" : "Mois précédent"}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Month Searchable Select */}
          <div className="w-52">
            <SearchableSelect
              options={availableMonths.map(m => ({ value: m.value, label: m.label }))}
              value={currentMonthValue}
              onChange={(val) => {
                const v = String(val) >= '2026-10' ? String(val) : '2026-10';
                setPortalReportMonth(v);
              }}
              placeholder="Sélectionner le mois"
              searchPlaceholder="Rechercher un mois..."
            />
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/60 transition cursor-pointer"
            title="Mois suivant"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Direct native month picker with min constraint */}
        <input
          type="month"
          min="2026-10"
          value={currentMonthValue}
          onChange={(e) => {
            const val = e.target.value >= '2026-10' ? e.target.value : '2026-10';
            setPortalReportMonth(val);
          }}
          className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs font-mono font-medium text-stone-700 focus:outline-none focus:border-[#2A7B76] shadow-2xs cursor-pointer"
          title="Saisie directe du mois (min: 2026-10)"
        />

        {isAtStartMonth && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
            <CheckCircle2 className="h-3 w-3" />
            Mois initial de pointage
          </span>
        )}
      </div>

      {/* Download / Generate CTA */}
      <button
        onClick={() => handleGeneratePortalReport(currentMonthValue)}
        disabled={isGeneratingReport}
        className="w-full md:w-auto bg-[#2A7B76] hover:bg-[#20635F] active:scale-[0.98] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer ml-auto"
      >
        <FileText className="h-4 w-4" />
        <span>{isGeneratingReport ? 'Génération du rapport...' : 'Télécharger Fiche Mensuelle Certifiée (PDF)'}</span>
      </button>
    </div>
  );
};
