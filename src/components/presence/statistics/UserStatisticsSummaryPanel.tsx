import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  CheckSquare,
  Clock,
  Trophy,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { AppUser, Employee, Presence, SalaryPayment, Task } from '../../../types';
import { computePresenceStatistics, StatisticsPeriod } from './statisticsCalculations';
import { computeEmployeeRendement } from '../../../utils/rendementCalculator';
import { findMatchingEmployee } from '../../../utils/roleUtils';
import { TaskTimeSpentHistogram } from './TaskTimeSpentHistogram';
import { TaskRedundancyPanel } from './TaskRedundancyPanel';

interface UserStatisticsSummaryPanelProps {
  employee?: Employee | null;
  employees?: Employee[];
  user?: AppUser | null;
  presences: Presence[];
  tasks: Task[];
  salaryPayments?: SalaryPayment[];
  onOpenFullRendement?: (emp: Employee) => void;
  onOpenTaskSheet?: (emp: Employee, mode: 'day' | 'month' | 'year') => void;
}

const PERIOD_OPTIONS: Array<{ id: StatisticsPeriod; label: string }> = [
  { id: 'this_month', label: 'Ce mois' },
  { id: 'this_week', label: 'Cette semaine' },
  { id: 'today', label: "Aujourd'hui" },
  { id: 'last_3_months', label: '3 mois' },
  { id: 'all', label: 'Tout' },
];

export const UserStatisticsSummaryPanel: React.FC<UserStatisticsSummaryPanelProps> = ({
  employee,
  employees = [],
  user,
  presences = [],
  tasks = [],
  salaryPayments = [],
  onOpenFullRendement,
  onOpenTaskSheet,
}) => {
  const [period, setPeriod] = useState<StatisticsPeriod>('all');

  const resolvedEmployee: Employee | null = useMemo(() => {
    if (employee) return employee;
    if (user) {
      const matched = findMatchingEmployee(employees, user);
      if (matched) return matched;
      return {
        id: user.employeeId || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        roleType:
          user.role === 'administrateur'
            ? 'administrateur'
            : user.role === 'responsable'
            ? 'responsable'
            : 'employé',
        department: user.department || 'Général',
        status: 'en_poste',
        employmentStatus: 'en_poste',
        hireDate: user.createdAt ? user.createdAt.split('T')[0] : '',
        salary: 0,
      };
    }
    return null;
  }, [employee, employees, user]);

  const presenceStats = useMemo(() => {
    if (!resolvedEmployee) return null;
    const computed = computePresenceStatistics([resolvedEmployee], presences, period);
    return {
      startStr: computed.startStr,
      endStr: computed.endStr,
      row: computed.statsByEmployee[0] || null,
    };
  }, [resolvedEmployee, presences, period]);

  const rendementMetrics = useMemo(() => {
    if (!resolvedEmployee) return null;
    const assiduite = presenceStats?.row ? presenceStats.row.assiduiteRate : 100;
    const periodFilter =
      period === 'all' || !presenceStats
        ? undefined
        : { startStr: presenceStats.startStr, endStr: presenceStats.endStr, period };
    return computeEmployeeRendement(resolvedEmployee, tasks, assiduite, periodFilter);
  }, [resolvedEmployee, tasks, presenceStats, period]);

  const paidStats = useMemo(() => {
    if (!resolvedEmployee) return { count: 0, totalNet: 0 };
    const empPayslips = (salaryPayments || []).filter(
      (p) => String(p.employeeId) === String(resolvedEmployee.id)
    );
    const totalNet = empPayslips.reduce((sum, p) => sum + (Number(p.netAmount) || 0), 0);
    return { count: empPayslips.length, totalNet };
  }, [resolvedEmployee, salaryPayments]);

  if (!resolvedEmployee || !presenceStats?.row || !rendementMetrics) {
    return (
      <div className="p-8 text-center text-xs text-stone-500 bg-stone-50 rounded-2xl border border-stone-200">
        Impossible de calculer les statistiques pour cet utilisateur.
      </div>
    );
  }

  const pRow = presenceStats.row;
  const rMet = rendementMetrics;

  const capacityLabel =
    rMet.capacityStatus === 'overloaded'
      ? 'Surcharge (> 50h)'
      : rMet.capacityStatus === 'available'
      ? 'Disponible (< 30h)'
      : 'Charge optimale';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-stone-500 mr-1 inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
            Période :
          </span>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPeriod(opt.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                period === opt.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenTaskSheet && (
            <button
              type="button"
              onClick={() => onOpenTaskSheet(resolvedEmployee, 'month')}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#2A7B76]" />
              <span>Feuille de Tâches</span>
            </button>
          )}
          {onOpenFullRendement && (
            <button
              type="button"
              onClick={() => onOpenFullRendement(resolvedEmployee)}
              className="px-3 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Détail Rendement</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500">Score Combiné RH</span>
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums">{rMet.globalCombinedScore}%</div>
          <p className="text-[11px] text-stone-500 tabular-nums">
            50% Assiduité ({rMet.assiduiteRate}%) + 50% Tâches ({rMet.taskRendementRate}%)
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500">Assiduité &amp; Présence</span>
            <ShieldCheck className="h-4 w-4 text-[#2A7B76]" />
          </div>
          <div className="text-2xl font-bold text-[#2A7B76] tabular-nums">{pRow.assiduiteRate}%</div>
          <p className="text-[11px] text-stone-500 tabular-nums">
            Présence {pRow.presenceRate}% · Ponctualité {pRow.ponctualiteRate}%
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500">Rendement Tâches</span>
            <CheckSquare className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums">{rMet.taskRendementRate}%</div>
          <p className="text-[11px] text-stone-500 tabular-nums">
            {rMet.completedTasks}/{rMet.totalTasks} tâches · {rMet.completedSubtasks}/{rMet.totalSubtasks} sous-tâches
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500">Temps &amp; Charge</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-stone-900 tabular-nums">
            {rMet.effectiveHoursSpent}h
          </div>
          <p className="text-[11px] text-stone-500 tabular-nums">
            Est. {rMet.estimatedHoursTotal}h · Pointées {pRow.workedHoursTotal}h ({capacityLabel})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-3">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Indicateurs Détaillés de Présence
          </h4>
          <div className="grid grid-cols-3 gap-2.5 text-xs tabular-nums">
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Jours présents</span>
              <strong className="text-sm text-emerald-700 font-bold">
                {pRow.presentDays + pRow.lateDays + pRow.weekendWorkedDays}j
                {pRow.workingDaysInPeriod !== undefined && pRow.workingDaysInPeriod > 0
                  ? ` / ${pRow.workingDaysInPeriod}j`
                  : ''}
              </strong>
              {pRow.weekendWorkedDays > 0 && (
                <span className="block text-[10px] text-amber-700 font-semibold">
                  dont +{pRow.weekendWorkedDays}j WE
                </span>
              )}
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Retards</span>
              <strong className="text-sm text-amber-700 font-bold">{pRow.lateDays}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Absences</span>
              <strong className="text-sm text-rose-700 font-bold">{pRow.absentDays}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Départs anticipés</span>
              <strong className="text-sm text-stone-800 font-bold">{pRow.earlyDepartureDays}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Urgences</span>
              <strong className="text-sm text-stone-800 font-bold">{pRow.emergencyCount}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Score Présence</span>
              <strong className="text-sm text-[#2A7B76] font-bold">{pRow.globalScore} pts</strong>
            </div>
          </div>
          {paidStats.count > 0 && (
            <div className="text-[11px] text-stone-600 pt-1 border-t border-stone-200/70 tabular-nums">
              Paie cumulée : <strong className="text-stone-900">{paidStats.totalNet.toLocaleString('fr-FR')} XAF</strong> ({paidStats.count} bulletin{paidStats.count > 1 ? 's' : ''})
            </div>
          )}
        </div>

        <div className="p-4 bg-stone-50/70 rounded-2xl border border-stone-200/80 space-y-3">
          <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            Répartition Tâches, Jalons &amp; Alertes
          </h4>
          <div className="grid grid-cols-3 gap-2.5 text-xs tabular-nums">
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Terminées</span>
              <strong className="text-sm text-emerald-700 font-bold">{rMet.completedTasks}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">En cours</span>
              <strong className="text-sm text-blue-700 font-bold">{rMet.inProgressTasks}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">À faire</span>
              <strong className="text-sm text-stone-700 font-bold">{rMet.todoTasks}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Bloquées</span>
              <strong className="text-sm text-rose-700 font-bold">{rMet.blockedTasks}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">En retard</span>
              <strong className="text-sm text-amber-700 font-bold">{rMet.overdueTasks}</strong>
            </div>
            <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
              <span className="text-[10px] text-stone-500 block">Jalons</span>
              <strong className="text-sm text-stone-900 font-bold">
                {rMet.completedMilestones}/{rMet.milestonesCount}
              </strong>
            </div>
          </div>

          {rMet.topTimeTaskTitle ? (
            <div className="text-[11px] text-stone-600 pt-1 border-t border-stone-200/70 flex items-center justify-between gap-2">
              <span className="truncate">
                Tâche la plus chronophage : <strong className="text-stone-900">{rMet.topTimeTaskTitle}</strong>
              </span>
              <span className="font-mono font-bold text-[#2A7B76] shrink-0 tabular-nums">
                {rMet.topTimeTaskHours}h
              </span>
            </div>
          ) : (
            <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/70 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-stone-400" />
              <span>Aucune tâche active sur cette période.</span>
            </div>
          )}
        </div>
      </div>

      <TaskTimeSpentHistogram
        tasks={rMet.assignedTasks}
        employee={resolvedEmployee}
        title={`Temps passé par sous-tâche — ${resolvedEmployee.name}`}
        maxItems={8}
        showAssigneeInTooltip={false}
      />

      <TaskRedundancyPanel employee={resolvedEmployee} tasks={tasks} />
    </div>
  );
};

export default UserStatisticsSummaryPanel;
