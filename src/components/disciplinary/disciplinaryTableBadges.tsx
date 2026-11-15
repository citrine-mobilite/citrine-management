import React from 'react';
import { AlertTriangle, Scale, CheckCircle2, Clock } from 'lucide-react';
import { DisciplinaryIncident, DisciplinaryStatus } from '../../types';
import { exportToExcel } from '../../services/excelExportService';

export function exportDisciplinaryRegistryToExcel(incidents: DisciplinaryIncident[]) {
  const headers = [
    'Réf Dossier',
    'Date Commission',
    'Collaborateur',
    'Poste',
    'Département',
    "Chef d'Accusation / Titre",
    'Catégorie',
    'Gravité',
    'Statut Procédure',
    'Sanction',
    'Rapporteur',
  ];
  const rows = incidents.map((i) => [
    i.id,
    i.date,
    i.employeeName,
    i.employeeRole || '',
    i.employeeDepartment || '',
    i.title,
    i.category,
    i.severity.toUpperCase(),
    i.status.toUpperCase(),
    i.sanctionType || 'Non définie',
    i.reportedBy,
  ]);
  exportToExcel(
    'registre_conseil_discipline.xls',
    'Registre Officiel du Conseil de Discipline',
    headers,
    rows
  );
}

export function getDisciplinarySeverityBadge(severity: string) {
  switch (severity) {
    case 'critique':
      return (
        <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          🚨 Critique
        </span>
      );
    case 'grave':
      return (
        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          ⚠️ Grave
        </span>
      );
    case 'moyen':
      return (
        <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Moyen
        </span>
      );
    default:
      return (
        <span className="bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          Faible
        </span>
      );
  }
}

export function getDisciplinaryStatusBadge(status: DisciplinaryStatus) {
  switch (status) {
    case 'convoque':
      return (
        <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
          <Scale className="h-3 w-3 text-purple-700" />
          <span>Convoqué au Conseil</span>
        </span>
      );
    case 'delibere':
      return (
        <span className="bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3 text-sky-700" />
          <span>En Délibération</span>
        </span>
      );
    case 'sanctionne':
      return (
        <span className="bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
          <AlertTriangle className="h-3 w-3 text-rose-700" />
          <span>Sanctionné</span>
        </span>
      );
    case 'classe':
      return (
        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
          <CheckCircle2 className="h-3 w-3 text-emerald-700" />
          <span>Classé sans suite</span>
        </span>
      );
    case 'en_instruction':
      return (
        <span className="bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
          <span>En Instruction</span>
        </span>
      );
    default:
      return (
        <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0">
          <span>Dossier Ouvert</span>
        </span>
      );
  }
}
