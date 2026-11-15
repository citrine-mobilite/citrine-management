import React from 'react';
import {
  Car,
  Wrench,
  UserCheck,
  LogOut,
  LogIn,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { VisitorLog, VisitorPurpose, WorkerDomain } from '../../types';

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

export function getWorkerDomainLabel(domain?: WorkerDomain) {
  switch (domain) {
    case 'electricite': return '⚡ Électricité';
    case 'plomberie': return '🚰 Plomberie';
    case 'maconnerie': return '🧱 Maçonnerie / BTP';
    case 'climatisation_maintenance': return '❄️ Climatisation & Maintenance';
    default: return '🔧 Intervention Technique';
  }
}

interface VisitorsTableRowProps {
  visitor: VisitorLog;
  onSelectVisitor: (v: VisitorLog) => void;
  onQuickCheckOut: (v: VisitorLog) => Promise<void>;
  onQuickCheckIn: (v: VisitorLog) => Promise<void>;
  onAuthorizeAccess?: (v: VisitorLog) => Promise<void>;
  onRejectAccess?: (v: VisitorLog) => Promise<void>;
}

export const VisitorsTableRow: React.FC<VisitorsTableRowProps> = ({
  visitor: v,
  onSelectVisitor,
  onQuickCheckOut,
  onQuickCheckIn,
  onAuthorizeAccess,
  onRejectAccess,
}) => {
  const isWorker = v.personType === 'travailleur';

  return (
    <tr
      className="hover:bg-stone-50/90 transition group cursor-pointer"
      onClick={() => onSelectVisitor(v)}
    >
      <td className="py-3 px-3.5">
        <div className="flex items-center gap-1.5 mb-1">
          {isWorker ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
              <Wrench className="w-3 h-3 text-amber-700" />
              Travailleur
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-[#2A7B76] px-2 py-0.5 rounded-md border border-teal-200">
              <UserCheck className="w-3 h-3 text-[#2A7B76]" />
              Visiteur
            </span>
          )}
        </div>
        <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded-md text-[11px]">
          {v.badgeNumber}
        </span>
        <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{v.siteLocation}</p>
      </td>

      <td className="py-3 px-3.5">
        <p className="font-bold text-stone-900 group-hover:text-[#2A7B76] transition flex items-center gap-1.5">
          {v.visitorName}
        </p>
        <p className="text-[11px] text-stone-500 font-medium">
          {v.visitorCompany || (isWorker ? 'Prestataire BTP' : 'Particulier')} • {v.visitorPhone}
        </p>
        {v.idCardNumber && (
          <p className="text-[10px] text-stone-400 font-mono mt-0.5">
            CNI : {v.idCardNumber}
          </p>
        )}
        {v.vehiclePlate && (
          <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
            <Car className="w-3 h-3 text-stone-400" />
            Véhicule : {v.vehiclePlate}
          </p>
        )}
      </td>

      <td className="py-3 px-3.5">
        {isWorker ? (
          <div>
            <p className="font-bold text-amber-950">{v.supervisorName || 'Superviseur Bâtiment'}</p>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5">
              Supervision Désignée
            </span>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-stone-800">{v.hostEmployeeName}</p>
            <p className="text-[11px] text-stone-400">{v.hostDepartment || 'Citrine'}</p>
          </div>
        )}
      </td>

      <td className="py-3 px-3.5">
        {isWorker ? (
          <div>
            <span className="font-bold text-stone-800 block">
              {getWorkerDomainLabel(v.workerDomain)}
            </span>
            <span className="text-[10px] text-stone-500 italic block mt-0.5">
              Zone : {v.interventionPerimeter || 'Immeuble Citrine'}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-stone-700 font-medium block">{getPurposeLabel(v.purpose)}</span>
            {v.notes && <span className="text-[10px] text-stone-400 line-clamp-1">{v.notes}</span>}
          </div>
        )}
      </td>

      <td className="py-3 px-3.5 whitespace-nowrap">
        <span className="font-mono font-semibold text-stone-800">{v.checkInTime}</span>
        <p className="text-[10px] text-stone-400">{v.checkInDate}</p>
      </td>

      <td className="py-3 px-3.5 whitespace-nowrap">
        {v.checkOutTime ? (
          <span className="font-mono font-semibold text-stone-600">{v.checkOutTime}</span>
        ) : (
          <span className="text-stone-300 italic">—</span>
        )}
      </td>

      <td className="py-3 px-3.5 text-center whitespace-nowrap">
        {v.status === 'sur_site' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
            Sur site (Autorisé)
          </span>
        )}
        {v.status === 'attente_validation' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Attente Accord
          </span>
        )}
        {v.status === 'sorti' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            Sorti
          </span>
        )}
        {v.status === 'attendu' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Attendu
          </span>
        )}
        {v.status === 'refuse' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Accès Refusé
          </span>
        )}
      </td>

      <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onSelectVisitor(v)}
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer border border-stone-200/80"
            title="Voir la fiche détaillée complète"
          >
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span>Détail</span>
          </button>

          {v.status === 'attente_validation' && (
            <>
              <button
                type="button"
                onClick={() => onAuthorizeAccess?.(v)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer shadow-xs"
                title="Valider l'accord et donner le badge"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Autoriser</span>
              </button>
              <button
                type="button"
                onClick={() => onRejectAccess?.(v)}
                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition text-[11px] cursor-pointer border border-rose-200"
                title="Refuser l'accès"
              >
                Refuser
              </button>
            </>
          )}

          {v.status === 'sur_site' && (
            <button
              type="button"
              onClick={() => onQuickCheckOut(v)}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer border border-rose-200"
              title="Enregistrer la sortie et restitution du badge"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sortie</span>
            </button>
          )}

          {v.status === 'attendu' && (
            <button
              type="button"
              onClick={() => onQuickCheckIn(v)}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer border border-emerald-200"
              title="Confirmer l'arrivée"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Arrivée</span>
            </button>
          )}

          {v.status === 'sorti' && isWorker && (
            <button
              type="button"
              onClick={() => onQuickCheckIn(v)}
              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer border border-amber-200"
              title="Marquer une nouvelle entrée pour ce travailleur connu"
            >
              <RotateCcw className="w-3 h-3 text-amber-700" />
              <span>Ré-entrée</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
