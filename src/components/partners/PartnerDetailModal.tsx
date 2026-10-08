import React from 'react';
import { X, Phone, Mail, MapPin, Tag, UserCheck, Calendar } from 'lucide-react';
import { Partner } from '../../types';

interface PartnerDetailModalProps {
  partner: Partner | null;
  onClose: () => void;
}

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({ partner, onClose }) => {
  if (!partner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">{partner.category}</span>
            <h3 className="font-serif font-bold text-lg">{partner.firstName} {partner.lastName}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-stone-700">
          <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
            <div className="flex items-center gap-2 text-stone-800">
              <Phone className="h-4 w-4 text-[#2A7B76]" />
              <span className="font-bold">{partner.phone}</span>
            </div>
            {partner.email && (
              <div className="flex items-center gap-2 text-stone-600">
                <Mail className="h-4 w-4 text-[#2A7B76]" />
                <span>{partner.email}</span>
              </div>
            )}
            {partner.address && (
              <div className="flex items-center gap-2 text-stone-600">
                <MapPin className="h-4 w-4 text-[#2A7B76]" />
                <span>{partner.address}</span>
              </div>
            )}
          </div>

          <div>
            <span className="font-bold text-stone-900 block mb-1">Remarques / Notes :</span>
            <p className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-stone-600 text-xs italic">
              {partner.notes || 'Aucune remarque enregistrée.'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
