import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { DisciplinaryIncident } from '../../types';

interface DisciplinaryDetailIdentityProps {
  incident: DisciplinaryIncident;
}

export const DisciplinaryDetailIdentity: React.FC<DisciplinaryDetailIdentityProps> = ({
  incident,
}) => (
  <>
    {/* Identity & Context Banner */}
    <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 grid grid-cols-2 gap-4 text-xs">
      <div>
        <span className="text-stone-400 block text-[10px] uppercase font-bold">Collaborateur</span>
        <span className="font-bold text-stone-900 text-sm">{incident.employeeName}</span>
        <p className="text-stone-500">{incident.employeeRole} • {incident.employeeDepartment}</p>
      </div>
      <div>
        <span className="text-stone-400 block text-[10px] uppercase font-bold">Signalé par</span>
        <span className="font-bold text-stone-800">{incident.reportedBy}</span>
        <p className="text-stone-500">{incident.reportedByRole}</p>
      </div>
      <div>
        <span className="text-stone-400 block text-[10px] uppercase font-bold">Date & Gravité</span>
        <span className="font-semibold text-stone-800">
          {new Date(incident.date).toLocaleDateString('fr-FR')} {incident.incidentTime && `à ${incident.incidentTime}`}
        </span>
        <div className="mt-0.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            {incident.severity}
          </span>
        </div>
      </div>
      <div>
        <span className="text-stone-400 block text-[10px] uppercase font-bold">Règle & Lieu</span>
        <p className="font-medium text-stone-800">{incident.ruleViolated || 'Règlement Intérieur Général'}</p>
        <p className="text-stone-500">{incident.location || 'Sur site'}</p>
      </div>
    </div>

    {/* Description */}
    <div className="space-y-2">
      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">Exposé des faits matériels</h4>
      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
        {incident.description}
      </div>
    </div>

    {/* Applied Sanction details if any */}
    {incident.sanctionType && (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-rose-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-rose-700" /> Decision & Sanction Appliquée
          </span>
          <span className="text-rose-700 font-bold">{incident.sanctionDate}</span>
        </div>
        <p className="font-bold text-rose-950 text-sm capitalize">
          {incident.sanctionType.replace('_', ' ')}
        </p>
        {incident.sanctionDetails && (
          <p className="text-rose-800 text-xs">{incident.sanctionDetails}</p>
        )}
      </div>
    )}
  </>
);
