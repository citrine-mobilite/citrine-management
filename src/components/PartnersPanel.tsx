import React, { useState } from 'react';
import { Users, Plus, Search, Eye, Edit3, Download, FileText } from 'lucide-react';
import { Partner, PartnerCategory, PartnerStatus, NotificationLog } from '../types';
import { PartnerStatsCards } from './partners/PartnerStatsCards';
import { PartnerDetailModal } from './partners/PartnerDetailModal';
import { exportToExcel } from '../services/excelExportService';
import { exportElementToPdf } from '../services/pdfExportService';

interface PartnersPanelProps {
  partners: Partner[];
  onUpdatePartners: (partners: Partner[]) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  currentRole: string;
  onAddNotification?: (log: NotificationLog) => void;
}

export default function PartnersPanel({
  partners,
  onUpdatePartners,
  showToast,
}: PartnersPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<Partner | null>(null);

  const filteredPartners = partners.filter((p) => {
    const fullName = `${p.lastName} ${p.firstName}`.toLowerCase();
    const matchSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const handleExportExcel = () => {
    const headers = ['ID', 'Nom', 'Prénom', 'Catégorie', 'Téléphone', 'Email', 'Adresse', 'Statut'];
    const rows = partners.map((p) => [
      p.id,
      p.lastName,
      p.firstName,
      p.category,
      p.phone,
      p.email || '',
      p.address || '',
      p.status,
    ]);
    exportToExcel('partenaires_et_intervenants.xls', 'Annuaire des Partenaires & Clients Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('partners-panel-container', 'partenaires_et_intervenants.pdf');
  };

  return (
    <div id="partners-panel-container" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-200" />
          <h2 className="font-serif font-bold text-xl">Partenaires, Clients & Intervenants</h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white border border-emerald-400/30 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileText className="h-3.5 w-3.5 text-rose-300" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <PartnerStatsCards partners={partners} />

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 text-xs rounded-xl text-stone-700 outline-none"
        >
          <option value="all">Toutes catégories</option>
          <option value="Motoman">Motoman</option>
          <option value="Taximan">Taximan</option>
          <option value="Particulier">Particulier</option>
          <option value="Fournisseur">Fournisseur</option>
          <option value="Prestataire">Prestataire</option>
        </select>
      </div>

      {/* Partners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredPartners.map((p) => (
          <div
            key={p.id}
            className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition flex items-center justify-between gap-3"
          >
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                {p.category}
              </span>
              <h4 className="font-bold text-xs text-stone-900 mt-1">
                {p.firstName} {p.lastName}
              </h4>
              <p className="text-[11px] text-stone-500 font-mono mt-0.5">{p.phone}</p>
            </div>

            <button
              onClick={() => setSelectedPartnerDetails(p)}
              className="p-2 rounded-xl bg-stone-100 hover:bg-[#2A7B76] hover:text-white transition cursor-pointer"
              title="Voir détails"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      <PartnerDetailModal partner={selectedPartnerDetails} onClose={() => setSelectedPartnerDetails(null)} />
    </div>
  );
}
