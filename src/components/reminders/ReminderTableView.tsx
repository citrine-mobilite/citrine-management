import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpDown,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  FileText,
  RefreshCw,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Reminder, Employee } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';
import {
  RENEWAL_CYCLE_LABELS,
  computeReminderUrgency,
  formatDeadlineFrenchDate,
  getReminderCategoryLabel,
  sortRemindersByUrgency,
} from '../../services/reminderService';

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
  const [sortField, setSortField] = useState<'urgency' | 'date' | 'title'>('urgency');
  const [sortAsc, setSortAsc] = useState(true);
  const pageSize = 10;

  const sortedReminders = useMemo(() => {
    if (sortField === 'urgency') {
      const list = sortRemindersByUrgency(reminders);
      return sortAsc ? list : list.reverse();
    }
    return [...reminders].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = `${a.expirationDate || a.date || ''} ${a.time || ''}`;
        const dateB = `${b.expirationDate || b.date || ''} ${b.time || ''}`;
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

  const toggleSort = (field: 'urgency' | 'date' | 'title') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getTargetLabel = (reminder: Reminder) => {
    if (reminder.allEmployees) return "Toute l'équipe";
    if (!reminder.employeeIds || reminder.employeeIds.length === 0) return 'Direction';
    if (reminder.employeeIds.length === 1) {
      const emp = employees.find((e) => e.id === reminder.employeeIds?.[0]);
      return emp ? emp.name : '1 personne';
    }
    return `${reminder.employeeIds.length} personnes`;
  };

  const handleExportExcel = () => {
    const headers = [
      'Document / Intitulé',
      'Élément concerné',
      'Catégorie',
      'Échéance',
      'Statut',
      'Périodicité',
      'Alerte accueil',
      'Destinataires',
    ];
    const rows = sortedReminders.map((r) => {
      const urgency = computeReminderUrgency(r);
      return [
        r.title || r.note || '',
        r.entityName || '',
        getReminderCategoryLabel(r.category),
        urgency.targetDateStr || 'Non datée',
        urgency.statusLabel,
        RENEWAL_CYCLE_LABELS[r.renewalCycle || 'none'],
        `J-${urgency.leadDays}`,
        getTargetLabel(r),
      ];
    });
    exportToExcel(
      'echeances_et_alertes.xls',
      'Registre des Échéances & Alertes Citrine',
      headers,
      rows
    );
  };

  const handleExportPdf = () => {
    exportElementToPdf('reminders-table-container', 'echeances_et_alertes.pdf');
  };

  return (
    <div
      id="reminders-table-container"
      className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden"
    >
      <div className="p-4 border-b border-stone-100 flex items-center justify-between gap-3 bg-stone-50/50">
        <h4 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-2">
          <Bell className="h-4 w-4 text-[#2A7B76]" />
          Registre des échéances & alertes ({sortedReminders.length})
        </h4>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-stone-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200/80">
            <tr>
              <th
                className="py-3 px-4 cursor-pointer hover:text-stone-800 transition select-none"
                onClick={() => toggleSort('urgency')}
              >
                <div className="flex items-center gap-1">
                  <span>Statut</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-stone-800 transition select-none"
                onClick={() => toggleSort('title')}
              >
                <div className="flex items-center gap-1">
                  <span>Document & Élément</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="py-3 px-4">Catégorie & Cycle</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-stone-800 transition select-none"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  <span>Échéance</span>
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
                  Aucune échéance ou alerte trouvée.
                </td>
              </tr>
            ) : (
              paginatedReminders.map((reminder) => {
                const isRinging = ringingReminderId === reminder.id;
                const title = reminder.title || reminder.note || 'Échéance planifiée';
                const urgency = computeReminderUrgency(reminder);
                const cycle = reminder.renewalCycle || 'none';
                const isRecurring = cycle !== 'none';
                const hasSound = Boolean(reminder.time && reminder.time.trim().length > 0);

                return (
                  <tr
                    key={reminder.id}
                    className={`transition ${
                      isRinging ? 'bg-rose-50/90' : 'hover:bg-stone-50/80'
                    }`}
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold font-mono tabular-nums ${
                          urgency.level === 'expired' || urgency.level === 'critical'
                            ? 'text-rose-700'
                            : urgency.level === 'warning'
                            ? 'text-amber-700'
                            : urgency.level === 'resolved'
                            ? 'text-emerald-700'
                            : 'text-stone-600'
                        }`}
                      >
                        {urgency.level === 'expired' || urgency.level === 'critical' ? (
                          <AlertOctagon className="h-3.5 w-3.5 shrink-0" />
                        ) : urgency.level === 'warning' ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        ) : urgency.level === 'resolved' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                        )}
                        <span>{urgency.statusLabel}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="space-y-0.5">
                        <div className="font-bold text-stone-900">
                          {title}
                          {reminder.entityName && (
                            <span className="font-medium text-stone-500">
                              {' '}
                              — {reminder.entityName}
                            </span>
                          )}
                        </div>
                        {(reminder.note || reminder.documentRef) && (
                          <p className="text-[11px] text-stone-500 line-clamp-1">
                            {reminder.documentRef ? `Réf. ${reminder.documentRef} · ` : ''}
                            {reminder.note}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-stone-600">
                      <div className="font-semibold text-stone-800">
                        {getReminderCategoryLabel(reminder.category)}
                      </div>
                      <div className="text-stone-500">{RENEWAL_CYCLE_LABELS[cycle]}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] font-mono tabular-nums text-stone-700">
                      <div className="font-semibold">
                        {urgency.targetDateStr
                          ? formatDeadlineFrenchDate(urgency.targetDateStr)
                          : 'Non datée'}
                        {reminder.time ? ` · ${reminder.time}` : ''}
                      </div>
                      <div className="text-stone-400">Alerte J-{urgency.leadDays}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-stone-600">
                      {getTargetLabel(reminder)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {onRenewOrResolve && urgency.level !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => onRenewOrResolve(reminder)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#2A7B76] hover:bg-[#226763] text-white font-bold text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
                            title={
                              isRecurring
                                ? 'Valider et planifier la prochaine période'
                                : 'Valider'
                            }
                          >
                            {isRecurring ? (
                              <>
                                <RefreshCw className="h-3 w-3" />
                                <span>Renouveler</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Valider</span>
                              </>
                            )}
                          </button>
                        )}

                        {isRinging ? (
                          <button
                            type="button"
                            onClick={() => onStopAlarm(reminder)}
                            className="px-2 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <VolumeX className="h-3.5 w-3.5" />
                            <span>Stop</span>
                          </button>
                        ) : (
                          hasSound && (
                            <button
                              type="button"
                              onClick={() => onStartAlarm(reminder)}
                              className="p-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:text-[#2A7B76] text-stone-600 transition cursor-pointer"
                              title="Tester la sonnerie"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => onEdit(reminder)}
                          className="p-1.5 rounded-xl text-stone-400 hover:text-[#2A7B76] hover:bg-stone-100 transition cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(reminder.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Supprimer"
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

      <div className="p-4 bg-stone-50/80 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div>
          Affichage de{' '}
          <span className="font-bold font-mono tabular-nums text-stone-900">
            {paginatedReminders.length}
          </span>{' '}
          sur{' '}
          <span className="font-bold font-mono tabular-nums text-stone-900">
            {reminders.length}
          </span>{' '}
          échéances
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
                className={`w-7 h-7 rounded-lg text-xs font-bold font-mono tabular-nums transition cursor-pointer ${
                  currentPage === pageNum
                    ? 'bg-[#2A7B76] text-white'
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
