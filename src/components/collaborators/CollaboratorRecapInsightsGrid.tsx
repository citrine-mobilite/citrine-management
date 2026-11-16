import React, { useMemo } from 'react';
import { Employee, Presence, SalaryPayment, Task } from '../../types';
import { isTaskAssignedToEmployee, safeNum } from '../../utils/rendementTaskHelpers';
import { formatCollaboratorXAF } from './collaboratorConstants';

interface CollaboratorRecapInsightsGridProps {
  emp: Employee;
  presences: Presence[];
  payslips: SalaryPayment[];
  tasks: Task[];
}

function computeSeniorityLabel(hireDate?: string): string {
  if (!hireDate) return 'Non définie';
  const start = new Date(hireDate);
  if (Number.isNaN(start.getTime())) return hireDate;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 0) return 'À venir';
  const years = Math.floor(months / 12);
  months = months % 12;
  if (years === 0) return `${Math.max(1, months)} mois`;
  return months > 0 ? `${years} an${years > 1 ? 's' : ''} ${months} mois` : `${years} an${years > 1 ? 's' : ''}`;
}

function parseClockMinutes(hm?: string | null): number | null {
  if (!hm || !hm.includes(':')) return null;
  const [h, m] = hm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export const CollaboratorRecapInsightsGrid: React.FC<CollaboratorRecapInsightsGridProps> = ({
  emp,
  presences,
  payslips,
  tasks,
}) => {
  const stats = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    const todayStr = new Date().toISOString().split('T')[0];

    const lateCount = presences.filter((p) => p.status === 'late').length;
    const presentOrLate = presences.filter((p) => p.status === 'present' || p.status === 'late' || p.status === 'mission').length;
    const assiduiteRate = presences.length > 0 ? Math.min(100, Math.round((presentOrLate / presences.length) * 100)) : 100;

    let monthlyMinutes = 0;
    presences
      .filter((p) => (p.date || '').startsWith(currentMonthPrefix) && p.arrivalTime)
      .forEach((p) => {
        const arrM = parseClockMinutes(p.arrivalTime);
        const depM = parseClockMinutes(p.departureTime) ?? (arrM !== null ? arrM + 480 : null);
        if (arrM !== null && depM !== null && depM > arrM) {
          const pStart = parseClockMinutes(p.pauseStart);
          const pEnd = parseClockMinutes(p.pauseEnd);
          const breakM = pStart !== null && pEnd !== null && pEnd > pStart ? pEnd - pStart : 60;
          monthlyMinutes += Math.max(0, depM - arrM - (depM - arrM > 300 ? breakM : 0));
        }
      });
    const monthlyHours = safeNum(Math.round((monthlyMinutes / 60) * 10) / 10, 0);

    const myAllTasks = (tasks || []).filter((t) => isTaskAssignedToEmployee(t, emp));
    const completedTasks = myAllTasks.filter((t) => t.status === 'completed').length;
    const blockedTasks = myAllTasks.filter((t) => t.status === 'blocked').length;
    const overdueTasks = myAllTasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
    ).length;
    const taskRate = myAllTasks.length > 0 ? Math.round((completedTasks / myAllTasks.length) * 100) : 0;

    const totalNetPaid = payslips.reduce((sum, p) => sum + safeNum(p.netAmount, 0), 0);
    const lastPayslip = payslips[0];

    const missions = emp.missionHistory || [];
    const totalMissionDays = missions.reduce((sum, m) => sum + (Number(m.durationDays) || 0), 0);

    return {
      seniority: computeSeniorityLabel(emp.hireDate),
      assiduiteRate,
      lateCount,
      monthlyHours,
      totalTasks: myAllTasks.length,
      completedTasks,
      blockedTasks,
      overdueTasks,
      taskRate,
      totalNetPaid,
      lastPayslip,
      missionsCount: missions.length,
      totalMissionDays,
    };
  }, [emp, presences, payslips, tasks]);

  const specialSchedules: string[] = [];
  if (emp.allowLateArrival8_930) specialSchedules.push('Arrivée souple 08h00–09h30');
  if (emp.allowEarlyDeparture15_17) specialSchedules.push('Départ autorisé 15h00–17h00');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Ancienneté &amp; Poste
          </span>
          <div className="text-lg font-bold text-stone-900 tabular-nums">
            {stats.seniority}
          </div>
          <p className="text-[11px] text-stone-500">
            {emp.position || 'Collaborateur'} · Entrée {emp.hireDate || 'Non renseignée'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Assiduité &amp; Heures (Mois)
          </span>
          <div className="text-lg font-bold text-[#164E4B] tabular-nums">
            {stats.assiduiteRate}% · {stats.monthlyHours}h
          </div>
          <p className="text-[11px] text-stone-500 tabular-nums">
            {presences.length} pointage(s) ·{' '}
            <span className={stats.lateCount > 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
              {stats.lateCount} retard(s)
            </span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Exécution Tâches &amp; Retards
          </span>
          <div className="text-lg font-bold text-stone-900 tabular-nums">
            {stats.taskRate}% ({stats.completedTasks}/{stats.totalTasks})
          </div>
          <p className="text-[11px] text-stone-500 tabular-nums">
            {stats.overdueTasks} en retard · {stats.blockedTasks} bloquée(s)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-500 block">
            Rémunération Versée &amp; Missions
          </span>
          <div className="text-lg font-bold text-emerald-800 tabular-nums font-mono">
            {formatCollaboratorXAF(stats.totalNetPaid)}
          </div>
          <p className="text-[11px] text-stone-500 tabular-nums">
            {payslips.length} bulletin(s) · {stats.missionsCount} mission(s) ({stats.totalMissionDays} j.)
          </p>
        </div>
      </div>

      <div className="bg-stone-50/90 px-5 py-3.5 rounded-2xl border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Salaire contractuel : <strong className="text-stone-900 tabular-nums">{formatCollaboratorXAF(emp.salary || 0)}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Dernier bulletin : <strong className="text-stone-900">{stats.lastPayslip ? `${stats.lastPayslip.period} (${formatCollaboratorXAF(stats.lastPayslip.netAmount)})` : 'Aucun bulletin'}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Dérogations horaires :{' '}
            <strong className="text-stone-900">
              {specialSchedules.length > 0 ? specialSchedules.join(' / ') : 'Standard (08h00 – 17h00)'}
            </strong>
          </span>
        </div>
        <span className="text-[11px] font-mono text-stone-500 tabular-nums">
          Anniversaire : {emp.birthDate || 'Non renseigné'}
        </span>
      </div>
    </div>
  );
};
