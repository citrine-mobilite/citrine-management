import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Trash2, 
  Edit3, 
  Users, 
  Volume2, 
  VolumeX, 
  Repeat, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Download,
  FileText
} from 'lucide-react';
import { Reminder, Employee } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';

interface ReminderTableViewProps {
  reminders: Reminder[];
  employees?: Employee[];
  ringingReminderId?: string | null;
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
  exact: 'Exacte',
};

const RECURRENCE_LABELS: Record<string, string> = {
  once: 'Ponctuelle',
  daily: 'Quotidienne',
  weekdays: 'Jours ouvrés',
  weekends: 'Week-ends',
};

export const ReminderTableView: React.FC<ReminderTableViewProps> = ({
  reminders,
  employees = [],
  ringingReminderId,
  onStartAlarm,
  onStopAlarm,
  onEdit,
  onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'date' | 'title'>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const pageSize = 10;

  // Sorting
  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = `${a.date || ''} ${a.time || ''}`;
        const dateB = `${b.date || ''} ${b.time || ''}`;
        return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      } else {
        const titleA = (a.title || a.note || '').toLowerCase();
        const titleB = (b.title || b.note || '').toLowerCase();
        return sortAsc ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      }
    });
  }, [reminders, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedReminders.length / pageSize) || 1;
  const paginatedReminders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedReminders.slice(start, start + pageSize);
  }, [sortedReminders, currentPage]);

  const toggleSort = (field: 'date' | 'title') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getTargetLabel = (reminder: Reminder) => {
    if (reminder.allEmployees) return 'Tous les collaborateurs';
    if (!reminder.employeeIds || reminder.employeeIds.length === 0) return 'Tous';
    if (reminder.employeeIds.length === 1) {
      const emp = employees.find((e) => e.id === reminder.employeeIds?.[0]);
      return emp ? emp.name : '1 collaborateur';
    }
    return `${reminder.employeeIds.length} collaborateurs`;
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Intitulé', 'Date', 'Heure', 'Destinataires', 'Récurrence'];
    const rows = sortedReminders.map((r) => [
      r.id,
      r.title || r.note || '',
      r.date || '',
      r.time || '',
      getTargetLabel(r),
      r.recurrence ? RECURRENCE_LABELS[r.recurrence] || r.recurrence : 'Ponctuelle',
    ]);
    exportToExcel('alertes_et_rappels.xls', 'Registre des Alertes & Rappels Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('reminders-table-container', 'alertes_et_rappels.pdf');
  };

  return (
    <div id="reminders-table-container" className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden space-y-0">
      <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
        <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#2A7B76]" />
          Registre des Alertes ({sortedReminders.length})
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200/80">
            <tr>
              <th className="py-3 px-3 text-center w-12">État</th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-stone-800 transition select-none"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  <span>Intitulé & Description</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th 
                className="py-3 px-4 cursor-pointer hover:text-stone-800 transition select-none"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  <span>Date & Heure</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Périodes de Réveil</th>
              <th className="py-3 px-4">Destinataires</th>
              <th className="py-3 px-4">Récurrence</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {paginatedReminders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-stone-400 text-xs">
                  Aucune alerte trouvée dans ce tableau.
                </td>
              </tr>
            ) : (
              paginatedReminders.map((reminder) => {
                const isRinging = ringingReminderId === reminder.id;
                const title = reminder.title || reminder.note || 'Alerte planifiée';
                const showNote = reminder.title && reminder.note && reminder.title !== reminder.note;

                return (
                  <tr
                    key={reminder.id}
                    className={`transition ${
                      isRinging 
                        ? 'bg-rose-50/90 hover:bg-rose-100/80 animate-pulse' 
                        : 'hover:bg-stone-50/80'
                    }`}
                  >
                    {/* Ringing / State indicator */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
                            isRinging
                              ? 'bg-rose-600 text-white border-rose-600 animate-bounce'
                              : 'bg-emerald-50 text-[#2A7B76] border-emerald-200/60'
                          }`}
                        >
                          {isRinging ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </span>
                      </div>
                    </td>

                    {/* Titre & Note */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{title}</span>
                          {isRinging && (
                            <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.2 rounded-full">
                              Sonne !
                            </span>
                          )}
                        </div>
                        {showNote && (
                          <p className="text-[11px] text-stone-500 line-clamp-1">{reminder.note}</p>
                        )}
                      </div>
                    </td>

                    {/* Date & Heure */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        <span>
                          {reminder.date || 'Non daté'} {reminder.time ? `à ${reminder.time}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Périodes de réveil */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap max-w-xs">
                        {reminder.triggerPeriods && reminder.triggerPeriods.length > 0 ? (
                          reminder.triggerPeriods.map((period) => (
                            <span
                              key={period}
                              className="bg-emerald-50 text-[#2A7B76] px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-200/60"
                            >
                              {PERIOD_LABELS[period] || period}
                            </span>
                          ))
                        ) : (
                          <span className="text-stone-400 text-[11px]">Exacte</span>
                        )}
                      </div>
                    </td>

                    {/* Destinataires */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-700">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Users className="h-3 w-3 text-stone-400" />
                        <span>{getTargetLabel(reminder)}</span>
                      </div>
                    </td>

                    {/* Récurrence */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Repeat className="h-3 w-3 text-stone-400" />
                        <span>{RECURRENCE_LABELS[reminder.recurrence || 'once']}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Continuous Alarm Toggle */}
                        {isRinging ? (
                          <button
                            type="button"
                            onClick={() => onStopAlarm(reminder)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-xs transition cursor-pointer"
                            title="Arrêter la sonnerie"
                          >
                            <VolumeX className="h-3.5 w-3.5" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onStartAlarm(reminder)}
                            className="p-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:text-[#2A7B76] text-stone-600 transition cursor-pointer"
                            title="Déclencher la sonnerie en continu (sonne jusqu'à arrêt)"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEdit(reminder)}
                          className="p-1.5 rounded-xl text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 transition cursor-pointer"
                          title="Modifier l'alerte"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDelete(reminder.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Supprimer l'alerte"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div>
          Affichage de <span className="font-bold text-stone-900">{paginatedReminders.length}</span> sur{' '}
          <span className="font-bold text-stone-900">{reminders.length}</span> alertes
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
