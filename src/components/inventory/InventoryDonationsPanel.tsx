import React, { useState } from 'react';
import { Heart, Building2, Search, Calendar, DollarSign, Gift, CheckCircle2 } from 'lucide-react';
import { InventoryItem, InventoryDonationRecord } from '../../types';

interface InventoryDonationsPanelProps {
  inventoryItems: InventoryItem[];
}

export const InventoryDonationsPanel: React.FC<InventoryDonationsPanelProps> = ({ inventoryItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Aggregate all donations across inventory items
  const allDonations: InventoryDonationRecord[] = inventoryItems.flatMap((item) => item.donations || []);

  const totalDonatedQty = allDonations.reduce((acc, d) => acc + d.quantity, 0);
  const totalDonatedValue = allDonations.reduce((acc, d) => acc + (d.estimatedValue || 0) * d.quantity, 0);
  const uniqueBeneficiariesCount = new Set(allDonations.map((d) => d.beneficiaryName.toLowerCase())).size;

  const filteredDonations = allDonations.filter((d) => {
    const matchesSearch =
      d.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.itemDesignation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.motive.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || d.beneficiaryType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 rounded-3xl p-5 text-white shadow-md space-y-1 border border-stone-800">
          <div className="flex items-center gap-2 text-stone-300 text-xs font-bold uppercase tracking-wider">
            <Heart className="h-4 w-4 text-emerald-400" /> Total Matériels Cédés
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalDonatedQty} unités</div>
          <p className="text-[11px] text-stone-400">Équipements réaffectés aux dons caritatifs</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-wider">
            <DollarSign className="h-4 w-4 text-emerald-600" /> Valeur Estimée des Dons
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800">
            {totalDonatedValue.toLocaleString('fr-FR')} FCFA
          </div>
          <p className="text-[11px] text-stone-500">Valeur résiduelle totale transmise</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="h-4 w-4 text-[#2A7B76]" /> Beneficiaires Enregistrés
          </div>
          <div className="text-2xl font-bold text-stone-900">{uniqueBeneficiariesCount} Organismes / Personnes</div>
          <p className="text-[11px] text-stone-500">Traçabilité complète des récepteurs</p>
        </div>
      </div>

      {/* Registry Table & Filters */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-700" /> Registre d'Historique des Dons & Cessions
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher bénéficiaire, équipement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
            >
              <option value="all">Tous les bénéficiaires</option>
              <option value="association">Associations & ONG</option>
              <option value="ecole">Écoles & Université</option>
              <option value="collaborateur">Collaborateurs</option>
              <option value="partenaire">Partenaires</option>
            </select>
          </div>
        </div>

        {filteredDonations.length === 0 ? (
          <div className="p-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 space-y-2">
            <Heart className="h-10 w-10 text-stone-300 mx-auto" />
            <p className="text-xs font-bold text-stone-700">Aucun don de matériel répertorié</p>
            <p className="text-[11px] text-stone-500">
              Pour effectuer un don, sélectionnez un matériel dans la grille et cliquez sur "Effectuer un Don".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px] tracking-wider bg-stone-50">
                  <th className="p-3 rounded-l-xl">Date</th>
                  <th className="p-3">Matériel Cédé</th>
                  <th className="p-3">Bénéficiaire</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-center">Quantité</th>
                  <th className="p-3 text-right">Valeur Estimée</th>
                  <th className="p-3 rounded-r-xl">Validé Par</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredDonations.map((don) => (
                  <tr key={don.id} className="hover:bg-stone-50 transition">
                    <td className="p-3 font-mono text-stone-500">{don.donationDate}</td>
                    <td className="p-3 font-bold text-stone-900">{don.itemDesignation}</td>
                    <td className="p-3 font-bold text-purple-900">{don.beneficiaryName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 capitalize">
                        {don.beneficiaryType}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono">{don.quantity}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-800">
                      {don.estimatedValue ? `${(don.estimatedValue * don.quantity).toLocaleString('fr-FR')} FCFA` : 'N/A'}
                    </td>
                    <td className="p-3 text-stone-600">{don.approvedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
