import React from 'react';
import { Users, UserCheck, Clock, Bike, Car, Building2 } from 'lucide-react';
import { Partner } from '../../types';

interface PartnerStatsCardsProps {
  partners: Partner[];
}

export const PartnerStatsCards: React.FC<PartnerStatsCardsProps> = ({ partners }) => {
  const total = partners.length;
  const active = partners.filter((p) => p.status === 'actif').length;
  const prospective = partners.filter((p) => p.status === 'futur_partenaire').length;
  const motomans = partners.filter((p) => p.category === 'Motoman').length;
  const taximans = partners.filter((p) => p.category === 'Taximan').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Total Partenaires</span>
          <Users className="h-4 w-4 text-[#2A7B76]" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{total}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Actifs</span>
          <UserCheck className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-emerald-700 mt-1">{active}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Futurs Partenaires</span>
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-amber-700 mt-1">{prospective}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Motomans</span>
          <Bike className="h-4 w-4 text-amber-600" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{motomans}</p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-stone-500">Taximans</span>
          <Car className="h-4 w-4 text-emerald-600" />
        </div>
        <p className="text-xl font-bold text-stone-900 mt-1">{taximans}</p>
      </div>
    </div>
  );
};
