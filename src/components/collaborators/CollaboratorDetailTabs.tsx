import React from 'react';
import { Download } from 'lucide-react';
import { Employee, Presence, SalaryPayment, Task } from '../../types';
import { downloadPayslipPdf } from '../../services/pdfExportService';
import { CollaboratorPresenceMap } from '../CollaboratorPresenceMap';
import { CollaboratorDetailTab, formatCollaboratorXAF } from './collaboratorConstants';
import { CollaboratorPresencesAndMissionsTab } from './CollaboratorPresencesAndMissionsTab';

interface CollaboratorDetailTabsProps {
  emp: Employee;
  activeDetailTab: CollaboratorDetailTab;
  empPayslips: SalaryPayment[];
  empPresences: Presence[];
  empTasks: Task[];
  rhReportMonth: string;
  setRhReportMonth: (m: string) => void;
  isGeneratingRhReport: boolean;
  onGenerateMonthlyReport: (emp: Employee, month: string) => void;
}

export const CollaboratorDetailTabs: React.FC<CollaboratorDetailTabsProps> = ({
  emp,
  activeDetailTab,
  empPayslips,
  empPresences,
  empTasks,
  rhReportMonth,
  setRhReportMonth,
  isGeneratingRhReport,
  onGenerateMonthlyReport,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
      {activeDetailTab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-xs text-stone-900">
              Registre des bulletins d&apos;embauche
            </h4>
            <span className="text-[10px] text-stone-500 font-bold bg-stone-50 px-2 py-0.5 rounded-md border">
              Devise : FCFA / XAF
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-stone-400 font-bold pb-2 uppercase tracking-wide text-[10px]">
                  <th className="pb-3">Période</th>
                  <th className="pb-3">Base</th>
                  <th className="pb-3">Net à payer</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {empPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-stone-400 italic">
                      Aucune fiche de paie enregistrée pour cet employé.
                    </td>
                  </tr>
                ) : (
                  empPayslips.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50/50">
                      <td className="py-3 font-bold text-stone-900">{p.period}</td>
                      <td className="py-3 font-mono text-stone-600">
                        {formatCollaboratorXAF(p.baseAmount)}
                      </td>
                      <td className="py-3 font-bold text-emerald-800 font-mono">
                        {formatCollaboratorXAF(p.netAmount)}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => downloadPayslipPdf(p, emp)}
                          className="p-1 rounded bg-emerald-50 text-[#2A7B76] hover:bg-[#2A7B76] hover:text-white transition cursor-pointer"
                          title="Télécharger PDF"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(activeDetailTab === 'presences' || activeDetailTab === 'missions') && (
        <CollaboratorPresencesAndMissionsTab
          mode={activeDetailTab}
          emp={emp}
          empPresences={empPresences}
          rhReportMonth={rhReportMonth}
          setRhReportMonth={setRhReportMonth}
          isGeneratingRhReport={isGeneratingRhReport}
          onGenerateMonthlyReport={onGenerateMonthlyReport}
        />
      )}

      {activeDetailTab === 'map' && (
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-xs text-stone-900 pb-1">
            Positions GPS des pointages
          </h4>
          <CollaboratorPresenceMap
            presences={empPresences}
            employeeName={emp.name}
            avatarUrl={emp.avatarUrl}
          />
        </div>
      )}

      {activeDetailTab === 'alerts' && (
        <div className="p-8 text-center text-xs text-stone-400 italic">
          Aucune alerte ou rappel pro actif pour le moment.
        </div>
      )}

      {activeDetailTab === 'tasks' && (
        <div className="space-y-3">
          <h4 className="font-serif font-bold text-xs text-stone-900 pb-2 border-b border-stone-100">
            Liste des jalons & tâches assignés
          </h4>
          <div className="space-y-2">
            {empTasks.length === 0 ? (
              <p className="text-stone-400 italic text-xs py-4 text-center">
                Aucune tâche assignée non terminée.
              </p>
            ) : (
              empTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/60"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-stone-900">{t.title}</span>
                    <p className="text-[10px] text-stone-400">
                      Échéance : {t.date} à {t.time}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                      t.priority === 'high'
                        ? 'bg-rose-50 text-rose-700'
                        : t.priority === 'medium'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
