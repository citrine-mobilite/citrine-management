import React from 'react';
import { Clock, Trophy, ShieldCheck } from 'lucide-react';
import { DailyTaskSheetData } from '../../../services/taskSheetService';

interface TaskSheetDailyTasksSectionProps {
  dailyData: DailyTaskSheetData;
}

export const TaskSheetDailyTasksSection: React.FC<TaskSheetDailyTasksSectionProps> = ({ dailyData }) => {
  return (
    <>
      <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        dailyData.capacity.capacityStatus === 'overloaded'
          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
          : dailyData.capacity.capacityStatus === 'optimal'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : 'bg-teal-50/70 border-teal-200 text-teal-950'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-stone-200">
              Capacité Opérationnelle du Jour
            </span>
            {dailyData.capacity.hasMilestone && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-600" />
                Jalon Clé Détecté : {dailyData.capacity.milestoneTitle}
              </span>
            )}
          </div>
          <p className="font-semibold text-xs leading-relaxed">
            {dailyData.capacity.capacityAdvice}
          </p>
        </div>

        <div className="text-right shrink-0 font-mono text-[11px] bg-white/90 p-2.5 rounded-xl border border-stone-200/80 shadow-3xs space-y-0.5">
          <div><strong>Capacité max :</strong> 12h / jour</div>
          <div className={dailyData.capacity.capacityStatus === 'overloaded' ? 'text-rose-600 font-bold' : 'text-stone-500'}>
            {dailyData.capacity.capacityStatus === 'overloaded' ? '⚠️ Surcharge (> 10h)' : 'Seuil surcharge > 10h'}
          </div>
          <div className="font-bold text-[#2A7B76]">
            {dailyData.totalTasks} sous-tâche(s) ({Math.round(dailyData.capacity.plannedMinutes / 60)}h)
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-gradient-to-r from-stone-50 via-white to-emerald-50/50 p-4 shadow-3xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#2A7B76]/10 text-[#2A7B76]">
                Synthèse Présence &amp; Rendement
              </span>
              <span className="text-xs text-stone-500 font-medium">
                {dailyData.dayName.toUpperCase()} • {dailyData.date}
              </span>
            </div>
            <h4 className="font-serif font-bold text-sm text-stone-900">
              Bilan Opérationnel d'Avancement &amp; Assiduité
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-3xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[9px] text-stone-400 font-bold block uppercase">Assiduité</span>
                <strong className="text-stone-800 text-xs font-bold">
                  {dailyData.presenceIncidents && dailyData.presenceIncidents.length > 0 ? 'Conforme avec remarques' : 'Ponctualité 100%'}
                </strong>
              </div>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-3xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2A7B76]" />
              <div>
                <span className="text-[9px] text-stone-400 font-bold block uppercase">Rendement Sous-Tâches</span>
                <strong className="text-stone-800 text-xs font-bold">
                  {dailyData.completedTasks}/{dailyData.totalTasks} ({dailyData.ratePercentage}%)
                </strong>
              </div>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-3xs flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-[9px] text-stone-400 font-bold block uppercase">Missions Majeures</span>
                <strong className="text-stone-800 text-xs font-bold">
                  {dailyData.topPriorities.filter(p => p.status === 'Fait').length}/{dailyData.topPriorities.length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-stone-300 overflow-hidden">
        <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>🎯</span>
            <span>LES 3 PRIORITÉS DU JOUR — si je ne fais que ça, la journée est réussie</span>
          </div>
          <span className="text-[10px] text-emerald-200 font-normal">Piliers majeurs de la journée</span>
        </div>
        <div className="divide-y divide-stone-200">
          {dailyData.topPriorities.map((p, idx) => (
            <div key={p.id || idx} className="p-2.5 flex items-center justify-between bg-white text-xs hover:bg-stone-50 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-bold text-stone-400 w-4 text-center">{idx + 1}.</span>
                <span className="font-bold text-blue-800 truncate">{p.title}</span>
                {p.isMilestone && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-md text-[9px] font-bold shrink-0 flex items-center gap-0.5">
                    <Trophy className="w-2.5 h-2.5" /> Jalon Clé
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-stone-500 uppercase font-mono font-semibold">{p.priority}</span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  p.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
          {dailyData.topPriorities.length === 0 && (
            <div className="p-3 text-center text-stone-500 font-medium italic bg-stone-50">
              Aucune priorité aujourd'hui (le collaborateur n'a rien fait ce jour).
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-stone-300 overflow-hidden">
        <div className="bg-[#164e4b] text-white px-3 py-2 font-bold text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span>📋</span>
            <span>TÂCHES DU JOUR (Sous-tâches concrètes traitées)</span>
          </div>
          <span className="text-[10px] text-emerald-200 font-mono">
            {dailyData.completedTasks}/{dailyData.totalTasks} terminées ({dailyData.ratePercentage}%)
          </span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#2A7B76] text-white font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3">Sous-Tâche</th>
              <th className="py-2 px-3">Mission Parente</th>
              <th className="py-2 px-2 text-center w-12">Prio</th>
              <th className="py-2 px-3 text-right w-24">Estimé (min)</th>
              <th className="py-2 px-3 text-center w-24">Échéance</th>
              <th className="py-2 px-3 text-center w-24">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 font-medium">
            {dailyData.tasks.map((t, idx) => (
              <tr key={idx} className="hover:bg-stone-50 transition">
                <td className="py-2 px-3 font-semibold text-blue-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{t.title}</span>
                </td>
                <td className="py-2 px-3 text-stone-600"><span className="truncate block max-w-xs">{t.parentTaskTitle}</span></td>
                <td className={`py-2 px-2 text-center font-bold text-[11px] ${
                  t.priorityLabel === 'P1' ? 'text-rose-600' : t.priorityLabel === 'P2' ? 'text-blue-600' : 'text-amber-600'
                }`}>{t.priorityLabel}</td>
                <td className="py-2 px-3 text-right font-mono">{t.estimatedMinutes} min</td>
                <td className="py-2 px-3 text-center font-mono text-[11px] text-stone-500">{t.dueDate}</td>
                <td className="py-2 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    t.status === 'Fait' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>{t.status}</span>
                </td>
              </tr>
            ))}
            {dailyData.tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center bg-stone-50">
                  <div className="inline-flex flex-col items-center gap-1 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
                    <span className="font-bold text-xs uppercase tracking-wide">N'a rien fait aujourd'hui</span>
                    <span className="text-[11px] text-rose-700">Aucune sous-tâche en cours ni terminée ce jour.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-[#164e4b] text-white font-bold text-xs">
            <tr>
              <td colSpan={2} className="py-2 px-3">Total sous-tâches / réalisées / avancement</td>
              <td className="py-2 px-2 text-center">{dailyData.totalTasks}</td>
              <td className="py-2 px-3 text-right">{dailyData.completedTasks} fait</td>
              <td className="py-2 px-3 text-center">{dailyData.ratePercentage}%</td>
              <td className="py-2 px-3 text-center">{dailyData.postponedCount} à suivre</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
};
