import React, { useState } from 'react';
import { User, Scale, AlertTriangle, ShieldCheck, FileText, CheckCircle2, Search } from 'lucide-react';
import { DisciplinaryIncident, Employee } from '../../types';

interface EmployeeDisciplinarySummaryProps {
  employees: Employee[];
  incidents: DisciplinaryIncident[];
  onSelectIncident: (incident: DisciplinaryIncident) => void;
  onOpenCreateForEmployee?: (employeeId: string) => void;
}

export const EmployeeDisciplinarySummary: React.FC<EmployeeDisciplinarySummaryProps> = ({
  employees,
  incidents,
  onSelectIncident,
  onOpenCreateForEmployee,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [searchFilter, setSearchFilter] = useState('');

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const getEmpName = (e?: Employee) => e ? (e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()) : '';

  const empIncidents = incidents.filter(
    (i) => i.employeeId === selectedEmployee?.id || (getEmpName(selectedEmployee) && i.employeeName.toLowerCase().includes(getEmpName(selectedEmployee).toLowerCase()))
  );

  const totalIncidents = empIncidents.length;
  const warningsCount = empIncidents.filter((i) => i.sanctionType === 'avertissement' || i.sanctionType === 'rappel_a_l_ordre').length;
  const severeCount = empIncidents.filter((i) => i.sanctionType === 'mise_a_pied' || i.sanctionType === 'licenciement_faute').length;
  const dismissedCount = empIncidents.filter((i) => i.status === 'classe').length;

  const filteredEmployees = employees.filter(
    (e) =>
      getEmpName(e).toLowerCase().includes(searchFilter.toLowerCase()) ||
      (e.department || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getRiskLevel = () => {
    if (severeCount > 0) return { label: 'ÉLEVÉ (Sanction lourde)', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    if (warningsCount >= 2) return { label: 'MODÉRÉ (Avertissements multiples)', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (totalIncidents > 0) return { label: 'FAIBLE (Sous surveillance)', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    return { label: 'IRRÉPROCHABLE (Aucun manquement)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const risk = getRiskLevel();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Collaborators List */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-4">
        <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
          <User className="h-4 w-4 text-[#2A7B76]" /> Effectif & Fiches Disciplinaires
        </h3>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Filtrer collaborateur..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        {/* Employee List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredEmployees.map((emp) => {
            const empIncCount = incidents.filter((i) => i.employeeId === emp.id).length;
            const isSelected = emp.id === selectedEmployee?.id;

            return (
              <button
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`w-full text-left p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#2A7B76]/10 border-[#2A7B76] text-stone-900 font-bold'
                    : 'bg-white hover:bg-stone-50 border-stone-200/80 text-stone-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-stone-900">
                    {getEmpName(emp)}
                  </div>
                  <div className="text-[10px] text-stone-500">{emp.role || 'Collaborateur'}</div>
                </div>
                {empIncCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                    {empIncCount} dossier{empIncCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    0 dossier
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Detailed Situation of Selected Employee */}
      {selectedEmployee && (
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400">Situation Disciplinaire Individuelle</span>
                <h2 className="text-lg font-bold text-stone-900">
                  {getEmpName(selectedEmployee)}
                </h2>
                <p className="text-xs text-stone-500">
                  {selectedEmployee.role || 'Collaborateur'} • Département : {selectedEmployee.department || 'Général'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${risk.color}`}>
                  Niveau d'Alerte : {risk.label}
                </span>
                {onOpenCreateForEmployee && (
                  <button
                    onClick={() => onOpenCreateForEmployee(selectedEmployee.id)}
                    className="px-3.5 py-2 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Scale className="h-3.5 w-3.5" /> Signaler un Fait
                  </button>
                )}
              </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-center">
                <span className="text-[10px] text-stone-400 font-bold uppercase block">Total Signalements</span>
                <span className="text-lg font-bold text-stone-900">{totalIncidents}</span>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80 text-center">
                <span className="text-[10px] text-amber-800 font-bold uppercase block">Avertissements</span>
                <span className="text-lg font-bold text-amber-900">{warningsCount}</span>
              </div>
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200/80 text-center">
                <span className="text-[10px] text-rose-800 font-bold uppercase block">Sanctions Lourde</span>
                <span className="text-lg font-bold text-rose-900">{severeCount}</span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80 text-center">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">Classés sans suite</span>
                <span className="text-lg font-bold text-emerald-900">{dismissedCount}</span>
              </div>
            </div>
          </div>

          {/* Dossiers List */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#2A7B76]" /> Historique des Dossiers Disciplinaires
            </h3>

            {empIncidents.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <ShieldCheck className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-800">Aucun dossier disciplinaire enregistré</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Ce collaborateur possède un historique disciplinaire vierge.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {empIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => onSelectIncident(inc)}
                    className="p-4 rounded-2xl bg-stone-50 hover:bg-stone-100/80 border border-stone-200/80 transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-stone-400">{inc.date}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-stone-200 text-stone-800">
                          {inc.severity}
                        </span>
                        <span className="text-xs font-bold text-[#2A7B76] capitalize">Statut: {inc.status}</span>
                      </div>
                      <h4 className="font-bold text-xs text-stone-900">{inc.title}</h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{inc.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {inc.sanctionType ? (
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 block capitalize">
                          {inc.sanctionType.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 block">
                          En cours de traitement
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
