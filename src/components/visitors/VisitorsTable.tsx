import React from 'react';
import { Car, LogOut, LogIn } from 'lucide-react';
import { VisitorLog, VisitorPurpose } from '../../types';

export function getPurposeLabel(p: VisitorPurpose) {
  switch (p) {
    case 'rdv_commercial': return 'RDV Commercial / Vente';
    case 'entretien_embauche': return 'Entretien de Recrutement';
    case 'livraison_colis': return 'Livraison Colis / Fret';
    case 'prestataire_technique': return 'Maintenance / Prestataire';
    case 'partenaire_institutionnel': return 'Partenaire (Yango, Gozem)';
    case 'reunion_direction': return 'Réunion de Direction';
    default: return 'Autre visite';
  }
}

interface VisitorsTableProps {
  visitors: VisitorLog[];
  onSelectVisitor: (v: VisitorLog) => void;
  onQuickCheckOut: (v: VisitorLog) => Promise<void>;
  onQuickCheckIn: (v: VisitorLog) => Promise<void>;
}

export const VisitorsTable: React.FC<VisitorsTableProps> = ({
  visitors,
  onSelectVisitor,
  onQuickCheckOut,
  onQuickCheckIn,
}) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/70 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-3 px-4">Badge & Site</th>
              <th className="py-3 px-4">Visiteur & Entreprise</th>
              <th className="py-3 px-4">Personne Visitée</th>
              <th className="py-3 px-4">Motif de la Visite</th>
              <th className="py-3 px-4">Arrivée</th>
              <th className="py-3 px-4">Départ</th>
              <th className="py-3 px-4 text-center">Statut</th>
              <th className="py-3 px-4 text-right">Action Émargement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {visitors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-stone-400">
                  Aucun enregistrement visiteur trouvé.
                </td>
              </tr>
            ) : (
              visitors.map((v) => (
                <tr key={v.id} className="hover:bg-stone-50/80 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[#2A7B76] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-[11px]">
                      {v.badgeNumber}
                    </span>
                    <p className="text-[11px] text-stone-400 mt-1">{v.siteLocation}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-stone-900">{v.visitorName}</p>
                    <p className="text-[11px] text-stone-500">
                      {v.visitorCompany || 'Particulier'} • {v.visitorPhone}
                    </p>
                    {v.vehiclePlate && (
                      <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <Car className="w-3 h-3 text-stone-400" />
                        Véhicule : {v.vehiclePlate}
                      </p>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-semibold text-stone-800">{v.hostEmployeeName}</p>
                    <p className="text-[11px] text-stone-400">{v.hostDepartment || 'Citrine'}</p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-stone-700 font-medium">{getPurposeLabel(v.purpose)}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono font-semibold text-stone-800">{v.checkInTime}</span>
                    <p className="text-[10px] text-stone-400">{v.checkInDate}</p>
                  </td>

                  <td className="py-3 px-4">
                    {v.checkOutTime ? (
                      <span className="font-mono font-semibold text-stone-600">{v.checkOutTime}</span>
                    ) : (
                      <span className="text-stone-300 italic">—</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {v.status === 'sur_site' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sur site
                      </span>
                    )}
                    {v.status === 'sorti' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                        Sorti
                      </span>
                    )}
                    {v.status === 'attendu' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Attendu
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {v.status === 'sur_site' ? (
                      <button
                        onClick={() => onQuickCheckOut(v)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sortie
                      </button>
                    ) : v.status === 'attendu' ? (
                      <button
                        onClick={() => onQuickCheckIn(v)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Entrée
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectVisitor(v)}
                        className="px-2.5 py-1 text-xs font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                      >
                        Détails
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
