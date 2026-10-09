import React from 'react';
import { X } from 'lucide-react';
import { VisitorLog } from '../../types';

interface VisitorDetailModalProps {
  visitor: VisitorLog;
  onClose: () => void;
}

export const VisitorDetailModal: React.FC<VisitorDetailModalProps> = ({ visitor, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-xs font-bold text-[#2A7B76]">{visitor.badgeNumber}</span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">{visitor.visitorName}</h3>
            <p className="text-xs text-stone-500">
              {visitor.visitorCompany || 'Particulier'} • {visitor.siteLocation}
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
              <span className="text-stone-400">N° Pièce Identité :</span>
              <span className="font-mono text-stone-800">{visitor.idCardNumber}</span>
            </div>
          )}
          {visitor.vehiclePlate && (
            <div className="flex justify-between">
              <span className="text-stone-400">Immatriculation :</span>
              <span className="font-mono font-bold text-stone-800">{visitor.vehiclePlate}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone-400">Hôte Citrine :</span>
            <span className="font-semibold text-stone-800">{visitor.hostEmployeeName}</span>
          </div>
          <div className="flex justify-between">
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
