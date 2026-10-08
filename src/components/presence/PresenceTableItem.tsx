import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { Presence, Employee } from '../../types';

interface PresenceTableItemProps {
  presence: Presence;
  employees: Employee[];
}

export const PresenceTableItem: React.FC<PresenceTableItemProps> = ({ presence, employees }) => {
  const emp = employees.find((e) => e.id === presence.employeeId);
  const empName = emp?.name || 'Collaborateur';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'late':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'absent':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition flex items-center justify-between gap-3">
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusBadge(
              presence.status
            )}`}
          >
            {presence.status === 'late' ? 'Retard' : presence.status === 'present' ? 'Présent' : 'Absent'}
          </span>
          <span className="text-[10px] text-stone-400 font-mono">{presence.date}</span>
        </div>

        <h4 className="font-bold text-xs text-stone-900 truncate">{empName}</h4>

        <div className="flex flex-wrap items-center gap-3 text-[10px] text-stone-500 font-mono">
          <span>Arrivée : {presence.arrivalTime || '--:--'}</span>
          <span>Départ : {presence.departureTime || '--:--'}</span>
          {presence.location && (
            <div className="flex items-center gap-1 font-sans">
              <MapPin className="h-3 w-3 text-stone-400" />
              <span>{presence.location}</span>
            </div>
          )}
        </div>

        {/* Badging method badges */}
        {presence.clockingMethod === 'admin_on_behalf' && (
          <div className="text-[9px] bg-indigo-50 border border-indigo-200 text-indigo-900 px-2 py-0.5 rounded-md font-sans font-bold flex items-center gap-1">
            <span>🛡️ Badgé par <b>{presence.badgedByAdminName || 'Responsable'}</b></span>
            <span>• Motif : <i>"{presence.adminBadgeReason || 'Non précisé'}"</i></span>
          </div>
        )}
        {presence.clockingMethod === 'qr_code_dynamic' && (
          <div className="inline-flex text-[9px] bg-teal-50 border border-teal-200 text-teal-800 px-2 py-0.5 rounded-md font-sans font-bold">
            ⚡ QR Dynamique (Présentiel Responsable)
          </div>
        )}
        {presence.clockingMethod === 'qr_code_door' && (
          <div className="inline-flex text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-sans font-bold">
            🚪 QR Code Porte (Certifié par GPS)
          </div>
        )}
        {presence.clockingMethod === 'badge_code_16' && (
          <div className="inline-flex text-[9px] bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-md font-sans font-bold">
            🔑 Clé 16 Caractères (Certifié par GPS)
          </div>
        )}
      </div>
    </div>
  );
};
