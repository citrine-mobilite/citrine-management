import React, { useState, useMemo } from 'react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  FileText,
} from 'lucide-react';
import { Reminder, Employee } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';
import {
  RENEWAL_CYCLE_LABELS,
  computeReminderUrgency,
  getReminderCategoryLabel,
} from '../../services/reminderService';
import { getReminderTargetLabel } from './reminderTableHelpers';
import { ReminderTableRow } from './ReminderTableRow';

interface ReminderTableViewProps {
  reminders: Reminder[];
  employees?: Employee[];
  ringingReminderId?: string | null;
  onStartAlarm: (reminder: Reminder) => void;
  onStopAlarm: (reminder: Reminder) => void;
  onRenewOrResolve?: (reminder: Reminder) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export const ReminderTableView: React.FC<ReminderTableViewProps> = ({
  reminders,
  employees = [],
  ringingReminderId,
  onStartAlarm,
  onStopAlarm,
  onRenewOrResolve,
  onEdit,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'date' | 'title'>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const pageSize = 10;

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = `${a.expirationDate || a.date || '9999-12-31'} ${a.time || ''}`;
        const dateB = `${b.expirationDate || b.date || '9999-12-31'} ${b.time || ''}`;
        return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      }
      const titleA = (a.title || a.note || '').toLowerCase();
      const titleB = (b.title || b.note || '').toLowerCase();
      return sortAsc ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
    });
  }, [reminders, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedReminders.length / pageSize) || 1;
  const paginatedReminders = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedReminders.slice(start, start + pageSize);
  }, [sortedReminders, currentPage, totalPages]);

  const toggleSort = (field: 'date' | 'title') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportExcel = () => {
    const headers = [
      'État',
      'Document / Obligation',
      'Élément concerné',
      'Catégorie',
      'Cycle',
      'Échéance',
      'Alerte J-N',
      'Destinataires',
    ];
    const rows = sortedReminders.map((r) => {
      const u = computeReminderUrgency(r);
      return [
        u.statusLabel,
        r.title || r.note || '',
        r.entityName || '',
        getReminderCategoryLabel(r.category),
        RENEWAL_CYCLE_LABELS[r.renewalCycle || 'none'],
        u.targetDateStr || 'Non datée',
        `J-${u.leadDays}`,
        getReminderTargetLabel(r, employees),
      ];
    });
    exportToExcel('echeances_et_alertes.xls', 'Registre Échéances & Documents Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('reminders-table-container', 'echeances_et_alertes.pdf');
  };

  return (
    <div
      id="reminders-table-container"
      className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden"
    >
      <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
        <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#2A7B76]" />
          Registre des Échéances ({sortedReminders.length})
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200/80">
            <tr>
              <th className="py-3 px-4">État &amp; Délai</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-stone-800 transition select-none"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  <span>Document &amp; Élément</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Catégorie &amp; Cycle</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-stone-800 transition select-none"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  <span>Échéance &amp; J-N</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Destinataires</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {paginatedReminders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-400 text-xs">
                  Aucune échéance trouvée pour ce filtre.
                </td>
              </tr>
            ) : (
              paginatedReminders.map((reminder) => (
                <ReminderTableRow
                  key={reminder.id}
                  reminder={reminder}
                  employees={employees}
                  isRinging={ringingReminderId === reminder.id}
                  onStartAlarm={onStartAlarm}
                  onStopAlarm={onStopAlarm}
                  onRenewOrResolve={onRenewOrResolve}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-stone-50/80 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div>
          Affichage de <span className="font-bold text-stone-900">{paginatedReminders.length}</span> sur{' '}
          <span className="font-bold text-stone-900">{reminders.length}</span> échéances
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#2A7B76] text-white shadow-2xs'
                    : 'bg-white border border-stone-200 hover:bg-stone-100 text-stone-700'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
