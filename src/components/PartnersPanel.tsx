import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Edit3, 
  Download, 
  UserCheck, 
  UserX, 
  Clock, 
  X, 
  Filter, 
  Briefcase,
  Bike,
  Car,
  User,
  Building2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  FileText,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Partner, PartnerCategory, PartnerStatus, NotificationLog } from '../types';
import { SearchableSelect } from './common/SearchableSelect';

interface PartnersPanelProps {
  partners: Partner[];
  onUpdatePartners: (partners: Partner[]) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  currentRole: string;
  onAddNotification?: (log: NotificationLog) => void;
}

const CATEGORY_ICONS: Record<PartnerCategory, React.ReactNode> = {
  'Motoman': <Bike className="h-4 w-4 text-amber-600" />,
  'Taximan': <Car className="h-4 w-4 text-emerald-600" />,
  'Particulier': <User className="h-4 w-4 text-blue-600" />,
  'Fournisseur': <Building2 className="h-4 w-4 text-purple-600" />,
  'Prestataire': <Briefcase className="h-4 w-4 text-indigo-600" />,
  'Autre': <Users className="h-4 w-4 text-stone-600" />
};

const STATUS_CONFIG: Record<PartnerStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  'actif': { label: 'Actif', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <UserCheck className="h-3 w-3" /> },
  'inactif': { label: 'Non actif', bg: 'bg-stone-100 border-stone-200', text: 'text-stone-600', icon: <UserX className="h-3 w-3" /> },
  'futur_partenaire': { label: 'Futur partenaire', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Clock className="h-3 w-3" /> }
};

export default function PartnersPanel({
  partners,
  onUpdatePartners,
  showToast,
  currentRole,
  onAddNotification
}: PartnersPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<Partner | null>(null);

  // Form states
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<PartnerCategory>('Motoman');
  const [status, setStatus] = useState<PartnerStatus>('actif');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter, itemsPerPage]);

  const filteredPartners = partners.filter(p => {
    const fullName = `${p.lastName} ${p.firstName}`.toLowerCase();
    const matchSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          p.phone.includes(searchTerm) || 
                          (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // Pagination calculations
  const totalItems = filteredPartners.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPartners = filteredPartners.slice(indexOfFirstItem, indexOfLastItem);

  const handleOpenAdd = () => {
    setEditingPartner(null);
    setLastName('');
    setFirstName('');
    setPhone('');
    setEmail('');
    setCategory('Motoman');
    setStatus('actif');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setLastName(partner.lastName);
    setFirstName(partner.firstName);
    setPhone(partner.phone);
    setEmail(partner.email || '');
    setCategory(partner.category);
    setStatus(partner.status);
    setAddress(partner.address || '');
    setNotes(partner.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim() || !phone.trim()) {
      showToast('Veuillez remplir le nom, le prénom et le numéro de téléphone.', 'error');
      return;
    }

    const nowStr = new Date().toISOString();

    if (editingPartner) {
      const updated = partners.map(p => p.id === editingPartner.id ? {
        ...p,
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        category,
        status,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined
      } : p);
      onUpdatePartners(updated);
      showToast('Partenaire modifié avec succès.', 'success');

      // Audit System log
      if (onAddNotification) {
        onAddNotification({
          id: `notif-${Date.now()}-part-edit`,
          type: 'system',
          recipient: 'Système',
          title: `[PARTENAIRES] Fiche partenaire mise à jour : ${lastName.trim()} ${firstName.trim()}`,
          content: `La fiche de "${lastName.trim()} ${firstName.trim()}" (Catégorie: ${category}, Tél: ${phone.trim()}, Statut: ${status}) a été mise à jour par ${currentRole}.`,
          payload: JSON.stringify({ id: editingPartner.id, lastName: lastName.trim(), firstName: firstName.trim(), category, status }),
          timestamp: nowStr
        });
      }
    } else {
      const newPartner: Partner = {
        id: 'part-' + Date.now(),
        lastName: lastName.trim(),
        firstName: firstName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        category,
        status,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: nowStr
      };
      onUpdatePartners([...partners, newPartner]);
      showToast('Nouveau partenaire ajouté avec succès.', 'success');

      // Audit System log
      if (onAddNotification) {
        onAddNotification({
          id: `notif-${Date.now()}-part-add`,
          type: 'system',
          recipient: 'Système',
          title: `[PARTENAIRES] Nouveau partenaire créé : ${lastName.trim()} ${firstName.trim()}`,
          content: `Le partenaire "${lastName.trim()} ${firstName.trim()}" (Catégorie: ${category}, Tél: ${phone.trim()}) a été ajouté à l'annuaire par ${currentRole}.`,
          payload: JSON.stringify(newPartner),
          timestamp: nowStr
        });
      }
    }

    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    const headers = ['ID', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Catégorie', 'Statut', 'Adresse', 'Notes', 'Date de création'];
    const rows = filteredPartners.map(p => [
      p.id,
      p.lastName,
      p.firstName,
      p.phone,
      p.email || '',
      p.category,
      p.status,
      p.address || '',
      p.notes || '',
      new Date(p.createdAt).toLocaleDateString('fr-FR')
    ]);

    // Build standard high-fidelity HTML table with Excel namespace formatting for seamless grid rendering
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Partenaires Citrine Management</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta charset="utf-8">
        <style>
          th { background-color: #be123c; color: white; font-weight: bold; font-family: sans-serif; text-align: left; padding: 6px; }
          td { font-family: sans-serif; text-align: left; padding: 4px; }
        </style>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `partenaires_citrine_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Liste des partenaires exportée sous Excel.', 'success');

    // System activity log
    if (onAddNotification) {
      onAddNotification({
        id: `notif-${Date.now()}-part-export`,
        type: 'system',
        recipient: 'Système',
        title: `[PARTENAIRES] Exportation Excel de l'annuaire`,
        content: `Exportation de ${filteredPartners.length} partenaire(s) au format Excel par ${currentRole}.`,
        payload: JSON.stringify({ count: filteredPartners.length, filters: { searchTerm, categoryFilter, statusFilter } }),
        timestamp: new Date().toISOString()
      });
    }
  };

  const totalCount = partners.length;
  const activeCount = partners.filter(p => p.status === 'actif').length;
  const prospectCount = partners.filter(p => p.status === 'futur_partenaire').length;
  const motomanCount = partners.filter(p => p.category === 'Motoman').length;
  const taximanCount = partners.filter(p => p.category === 'Taximan').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-xs sm:text-sm">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-br from-green-950 via-green-900 to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Annuaire des Partenaires
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-sm"
              title="Exporter vers Excel"
            >
              <Download className="h-4 w-4" />
              <span>Exporter (Excel)</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-green-950/50"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Partenaire</span>
            </button>
          </div>
        </div>

        {/* Mini Stats Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-green-800/60">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-green-200 text-xs">Total Partenaires</div>
            <div className="text-xl font-serif font-bold text-white mt-0.5">{totalCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-emerald-300 text-xs">Partenaires Actifs</div>
            <div className="text-xl font-serif font-bold text-white mt-0.5">{activeCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-amber-300 text-xs">Futurs / Prospects</div>
            <div className="text-xl font-serif font-bold text-white mt-0.5">{prospectCount}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-purple-300 text-xs">Motomen & Taximen</div>
            <div className="text-xl font-serif font-bold text-white mt-0.5">{motomanCount + taximanCount}</div>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email, adresse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="w-44">
            <SearchableSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { value: 'all', label: 'Toutes catégories' },
                { value: 'Motoman', label: 'Motoman', description: 'Chauffeur moto' },
                { value: 'Taximan', label: 'Taximan', description: 'Chauffeur taxi' },
                { value: 'Particulier', label: 'Particulier', description: 'Client / Particulier' },
                { value: 'Fournisseur', label: 'Fournisseur', description: 'Vendeur / Partenaire pro' },
                { value: 'Prestataire', label: 'Prestataire', description: 'Services extérieurs' },
                { value: 'Autre', label: 'Autre' }
              ]}
              placeholder="Catégorie"
              searchPlaceholder="Filtrer catégorie..."
              size="sm"
            />
          </div>

          <div className="w-44">
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'actif', label: 'Actif', badge: 'Actif', badgeColor: 'bg-emerald-100 text-emerald-800' },
                { value: 'inactif', label: 'Inactif', badge: 'Inactif', badgeColor: 'bg-stone-100 text-stone-600' },
                { value: 'futur_partenaire', label: 'Futur partenaire', badge: 'Prospect', badgeColor: 'bg-blue-100 text-blue-800' }
              ]}
              placeholder="Statut"
              searchPlaceholder="Filtrer statut..."
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Partners List / Elegant and high-capacity Table View */}
      {filteredPartners.length === 0 ? (
        <div className="bg-white rounded-3xl border border-green-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="font-serif font-bold text-green-950 text-base">Aucun partenaire trouvé</h3>
          <p className="text-stone-500 text-xs mt-1 max-w-sm mx-auto">
            Aucun partenaire ne correspond à vos critères de recherche actuels. Modifiez vos filtres ou ajoutez-en un nouveau.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter un partenaire</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
          {/* Table container for horizontal scrolling on mobile/small viewports */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/70 border-b border-green-100 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Partenaire</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Adresse / Ville</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Date d'ajout</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
                {currentPartners.map((partner) => {
                  const stCfg = STATUS_CONFIG[partner.status] || STATUS_CONFIG['actif'];
                  return (
                    <tr 
                      key={partner.id} 
                      className="hover:bg-green-50/20 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center font-serif font-bold text-xs shrink-0">
                            {partner.lastName.charAt(0)}{partner.firstName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-serif font-bold text-stone-900 hover:text-green-700 transition">
                              {partner.lastName} {partner.firstName}
                            </span>
                            <span className="block text-[10px] text-stone-400">ID: {partner.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-[11px] font-medium">
                          {CATEGORY_ICONS[partner.category]}
                          <span>{partner.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-stone-900">
                        <a href={`tel:${partner.phone}`} className="hover:text-green-600 transition flex items-center gap-1">
                          <Phone className="h-3 w-3 text-stone-400" />
                          <span>{partner.phone}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap max-w-xs truncate">
                        {partner.email ? (
                          <a href={`mailto:${partner.email}`} className="hover:text-green-600 transition flex items-center gap-1">
                            <Mail className="h-3 w-3 text-stone-400" />
                            <span>{partner.email}</span>
                          </a>
                        ) : (
                          <span className="text-stone-400 italic">Non spécifié</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap max-w-[150px] truncate">
                        {partner.address ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-stone-400" />
                            <span>{partner.address}</span>
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">Non spécifiée</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${stCfg.bg} ${stCfg.text}`}>
                          {stCfg.icon}
                          <span>{stCfg.label}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-stone-500">
                        {new Date(partner.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setSelectedPartnerDetails(partner)}
                            className="p-2 rounded-xl text-stone-400 hover:text-green-700 hover:bg-green-50 transition cursor-pointer"
                            title="Voir les détails complets"
                          >
                            <Eye className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(partner)}
                            className="p-2 rounded-xl text-stone-500 hover:text-green-700 hover:bg-green-50 transition cursor-pointer"
                            title="Modifier"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Elegant Pagination Controls with custom sizing */}
          <div className="bg-stone-50 border-t border-green-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-stone-500">Afficher</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 font-bold text-stone-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-green-500/20"
              >
                <option value={25}>25 lignes</option>
                <option value={50}>50 lignes</option>
                <option value={100}>100 lignes</option>
                <option value={200}>200 lignes</option>
                <option value={500}>500 lignes</option>
              </select>
              <span className="text-stone-400">|</span>
              <span className="text-stone-500">
                Lignes <strong className="text-stone-800">{indexOfFirstItem + 1}</strong> à <strong className="text-stone-800">{Math.min(indexOfLastItem, totalItems)}</strong> sur <strong className="text-stone-800">{totalItems}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                title="Première page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                title="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="px-3 py-1 bg-white border border-green-200 rounded-lg font-bold text-green-700 min-w-[60px] text-center shadow-2xs">
                Page {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                title="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                title="Dernière page"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Full Partner Details View (The "Eye" functionality) */}
      <AnimatePresence>
        {selectedPartnerDetails && (
          <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-green-100 w-full max-w-lg shadow-2xl overflow-hidden my-6"
            >
              <div className="px-5 py-4 border-b border-green-100 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-green-600 text-white">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-green-950 text-sm sm:text-base">
                      Fiche Partenaire détaillée
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPartnerDetails(null)}
                  className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-xs sm:text-sm">
                {/* Header card info */}
                <div className="flex items-center gap-4 bg-green-50/40 p-4 rounded-2xl border border-green-100/60">
                  <div className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center font-serif font-bold text-xl shadow-md">
                    {selectedPartnerDetails.lastName.charAt(0)}{selectedPartnerDetails.firstName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-serif font-bold text-stone-900 text-lg leading-tight">
                      {selectedPartnerDetails.lastName} {selectedPartnerDetails.firstName}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-stone-200 text-stone-700 text-[11px] font-semibold">
                        {CATEGORY_ICONS[selectedPartnerDetails.category]}
                        <span>{selectedPartnerDetails.category}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_CONFIG[selectedPartnerDetails.status].bg} ${STATUS_CONFIG[selectedPartnerDetails.status].text}`}>
                        {STATUS_CONFIG[selectedPartnerDetails.status].icon}
                        <span>{STATUS_CONFIG[selectedPartnerDetails.status].label}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Information details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Identifiant unique</div>
                    <div className="font-mono text-stone-800 font-semibold">{selectedPartnerDetails.id}</div>
                  </div>
                  <div className="space-y-1 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Date d'enregistrement</div>
                    <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-500" />
                      <span>{new Date(selectedPartnerDetails.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Téléphone</div>
                    <div className="font-semibold text-stone-800">
                      <a href={`tel:${selectedPartnerDetails.phone}`} className="hover:text-green-600 transition flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-stone-500" />
                        <span>{selectedPartnerDetails.phone}</span>
                      </a>
                    </div>
                  </div>
                  <div className="space-y-1 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                    <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Email</div>
                    <div className="font-semibold text-stone-800">
                      {selectedPartnerDetails.email ? (
                        <a href={`mailto:${selectedPartnerDetails.email}`} className="hover:text-green-600 transition flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-stone-500" />
                          <span className="truncate">{selectedPartnerDetails.email}</span>
                        </a>
                      ) : (
                        <span className="text-stone-400 italic">Non renseigné</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address block */}
                <div className="space-y-1.5 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                  <div className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Adresse / Secteur Géographique</div>
                  <div className="font-semibold text-stone-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>{selectedPartnerDetails.address || "Non spécifié"}</span>
                  </div>
                </div>

                {/* Notes and remarks block */}
                <div className="space-y-2 bg-green-50/20 p-4 rounded-xl border border-green-100/50">
                  <div className="text-[10px] text-green-950 uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-green-700" />
                    <span>Conditions & Notes Partenaire</span>
                  </div>
                  <p className="text-stone-600 italic text-xs leading-relaxed whitespace-pre-wrap">
                    {selectedPartnerDetails.notes ? `"${selectedPartnerDetails.notes}"` : "Aucune note ou condition particulière n'a été spécifiée pour ce partenaire pour le moment."}
                  </p>
                </div>

                {/* Actions inside details */}
                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedPartnerDetails(null);
                      handleOpenEdit(selectedPartnerDetails);
                    }}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Modifier la fiche</span>
                  </button>
                  <button
                    onClick={() => setSelectedPartnerDetails(null)}
                    className="px-5 py-2 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Add / Edit Partner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-green-100 w-full max-w-lg shadow-2xl overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-green-100 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-green-600 text-white">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-green-950 text-sm sm:text-base">
                    {editingPartner ? 'Modifier le Partenaire' : 'Ajouter un Partenaire'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Fotso"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Jean-Paul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Numéro de Téléphone *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: +237 699 00 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-800 flex items-center justify-between">
                    <span>Email</span>
                    <span className="text-[10px] text-stone-400 font-normal">(Optionnel)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: contact@partenaire.cm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Catégorie / Type *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PartnerCategory)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
                  >
                    <option value="Motoman">Motoman</option>
                    <option value="Taximan">Taximan</option>
                    <option value="Particulier">Particulier</option>
                    <option value="Fournisseur">Fournisseur</option>
                    <option value="Prestataire">Prestataire</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">Statut *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PartnerStatus)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
                  >
                    <option value="actif">Actif</option>
                    <option value="inactif">Non actif</option>
                    <option value="futur_partenaire">Futur partenaire / Prospect</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">Adresse / Ville</label>
                <input
                  type="text"
                  placeholder="Ex: Douala, Akwa"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">Notes / Remarques</label>
                <textarea
                  rows={3}
                  placeholder="Informations utiles, conditions de collaboration..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 font-semibold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition shadow-md cursor-pointer"
                >
                  {editingPartner ? 'Enregistrer les modifications' : 'Ajouter le partenaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
