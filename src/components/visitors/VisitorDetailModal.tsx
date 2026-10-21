import React from 'react';
import { X, Wrench, UserCheck } from 'lucide-react';
import { VisitorLog } from '../../types';
import { getWorkerDomainLabel, getPurposeLabel } from './VisitorsTable';

interface VisitorDetailModalProps {
  visitor: VisitorLog;
  onClose: () => void;
}

export const VisitorDetailModal: React.FC<VisitorDetailModalProps> = ({ visitor, onClose }) => {
  const isWorker = visitor.personType === 'travailleur';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-mono text-xs font-bold text-[#2A7B76] bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {visitor.badgeNumber}
              </span>
              {isWorker ? (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-amber-700" />
                  Travailleur Immeuble
                </span>
              ) : (
                <span className="text-[10px] font-bold bg-teal-50 text-[#2A7B76] px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-[#2A7B76]" />
                  Visiteur
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-stone-900">{visitor.visitorName}</h3>
            <p className="text-xs text-stone-500">
              {visitor.visitorCompany || (isWorker ? 'Prestataire BTP' : 'Particulier')} • {visitor.siteLocation}
            </p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 bg-stone-50 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-stone-400">Téléphone :</span>
            <span className="font-semibold text-stone-800">{visitor.visitorPhone}</span>
          </div>

          {visitor.idCardNumber && (
            <div className="flex justify-between">
              <span className="text-stone-400">N° Pièce Identité (CNI) :</span>
              <span className="font-mono text-stone-800">{visitor.idCardNumber}</span>
            </div>
          )}

          {visitor.vehiclePlate && (
            <div className="flex justify-between">
              <span className="text-stone-400">Immatriculation :</span>
              <span className="font-mono font-bold text-stone-800">{visitor.vehiclePlate}</span>
            </div>
          )}

          {isWorker ? (
            <>
              <div className="flex justify-between">
                <span className="text-stone-400">Domaine Technique :</span>
                <span className="font-bold text-stone-900">{getWorkerDomainLabel(visitor.workerDomain)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Superviseur Désigné :</span>
                <span className="font-bold text-amber-950">{visitor.supervisorName || 'Direction Technique'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Périmètre d'intervention :</span>
                <span className="font-semibold text-stone-800">{visitor.interventionPerimeter || 'Immeuble Citrine'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Liste préalable prestataire :</span>
                <span className="font-semibold text-stone-800">
                  {visitor.isPreAuthorized ? '✅ Référencé sur la liste' : '⚠️ Non référencé (Accord exceptionnel)'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span className="text-stone-400">Hôte Citrine (Visité) :</span>
                <span className="font-semibold text-stone-800">{visitor.hostEmployeeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Motif de la visite :</span>
                <span className="font-semibold text-stone-800">{getPurposeLabel(visitor.purpose)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-1 border-t border-stone-200">
            <span className="text-stone-400">Heure d'arrivée :</span>
            <span className="font-semibold text-stone-800">
              {visitor.checkInTime} ({visitor.checkInDate})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Heure de départ :</span>
            <span className="font-semibold text-stone-800">
              {visitor.checkOutTime || 'Toujours sur site'}
            </span>
          </div>
        </div>

        {visitor.notes && (
          <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
            {visitor.notes}
          </p>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
