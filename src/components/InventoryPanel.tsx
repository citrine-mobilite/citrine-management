import React, { useState } from 'react';
import { Package, Search, Plus, Heart, Layers, LayoutGrid, Table } from 'lucide-react';
import { InventoryItem, Role, Employee, NotificationLog, AppUser, InventoryAssignment } from '../types';
import { InventoryStatsCards } from './inventory/InventoryStatsCards';
import { InventoryItemCard } from './inventory/InventoryItemCard';
import { InventoryTableView } from './inventory/InventoryTableView';
import { InventoryCreateModal } from './inventory/InventoryCreateModal';
import { AssignmentsHistoryModal } from './inventory/AssignmentsHistoryModal';
import { InventoryAssignModal } from './inventory/InventoryAssignModal';
import { InventoryReturnModal } from './inventory/InventoryReturnModal';
import { InventoryDonationsPanel } from './inventory/InventoryDonationsPanel';
import { InventoryDetailDrawer } from './inventory/InventoryDetailDrawer';
import { InventoryDonateModal } from './inventory/InventoryDonateModal';
import { showSuccessAlert, executeOperationWithLoading, executeDeleteWithSweetAlert } from '../utils/sweetAlert';
import { HumaanFinance } from './illustrations/HumaanIllustrations';

interface InventoryPanelProps {
  inventoryItems: InventoryItem[];
  onUpdateInventoryItems: (items: InventoryItem[]) => void;
  currentRole?: Role;
  currentUser?: AppUser | null;
  employees?: Employee[];
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function InventoryPanel({
  inventoryItems = [],
  onUpdateInventoryItems,
  employees = [],
  currentUser,
  showToast,
}: InventoryPanelProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [assignItem, setAssignItem] = useState<InventoryItem | null>(null);
  const [returnItem, setReturnItem] = useState<InventoryItem | null>(null);
  const [targetAssignment, setTargetAssignment] = useState<InventoryAssignment | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryItem | null>(null);
  const [donateItem, setDonateItem] = useState<InventoryItem | null>(null);

  // Inventaire réel passé par le composant parent ou stocké
  const effectiveItems = inventoryItems || [];

  const handleSaveItem = async (item: InventoryItem) => {
    const exists = effectiveItems.some((i) => i.id === item.id);
    await executeOperationWithLoading({
      loadingTitle: exists ? 'Mise à jour du matériel...' : 'Ajout au stock...',
      loadingText: 'Enregistrement de l\'équipement en base de données...',
      action: async () => {
        if (exists) {
          onUpdateInventoryItems(effectiveItems.map((i) => (i.id === item.id ? item : i)));
        } else {
          onUpdateInventoryItems([item, ...effectiveItems]);
        }
      },
      successTitle: exists ? 'Article modifié !' : 'Article enregistré !',
      successMessage: `L'article "${item.designation}" a été enregistré avec succès dans l'inventaire.`,
    });
  };

  const handleDeleteItem = async (id: string) => {
    const target = effectiveItems.find((i) => i.id === id);
    await executeDeleteWithSweetAlert({
      title: 'Supprimer ce matériel ?',
      text: 'Voulez-vous vraiment retirer cet équipement de l\'inventaire ?',
      itemName: target?.designation,
      action: async () => {
        onUpdateInventoryItems(effectiveItems.filter((i) => i.id !== id));
      },
      successTitle: 'Matériel supprimé !',
      successMessage: target?.designation ? `"${target.designation}" a été supprimé de l'inventaire.` : 'L\'article a été supprimé.',
    });
  };

  const handleItemUpdated = async (updated: InventoryItem) => {
    onUpdateInventoryItems(effectiveItems.map((i) => (i.id === updated.id ? updated : i)));
    if (historyItem?.id === updated.id) setHistoryItem(updated);
    await showSuccessAlert('Inventaire synchronisé', `L'équipement "${updated.designation}" a été mis à jour.`);
  };

  // Unique locations for dropdown
  const uniqueLocations = Array.from(
    new Set(effectiveItems.map((i) => i.location).filter(Boolean))
  );

  // Filter items
  const filtered = effectiveItems.filter((i) => {
    const matchesSearch =
      i.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.reference || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      i.status === statusFilter ||
      (i.quantitiesByStatus && (i.quantitiesByStatus as any)[statusFilter] > 0);

    const matchesCategory =
      categoryFilter === 'all' || i.category === categoryFilter;

    const matchesLocation =
      locationFilter === 'all' || i.location === locationFilter;

    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  });

  return (
    <div className="space-y-6">
      {/* Clean Banner avec HumaanFinance */}
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#216762] to-emerald-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10 w-full md:w-auto text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <Package className="h-6 w-6 text-emerald-200" />
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-white">
              Gestion du Matériel &amp; Inventaires
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-100 border border-white/15">
            <span>{effectiveItems.length} article{effectiveItems.length > 1 ? 's' : ''} répertorié{effectiveItems.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Illustration Humaine Vectorielle Humaaans */}
        <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
          <HumaanFinance className="w-40 h-28 md:w-48 md:h-32 drop-shadow-md" />
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 z-10 w-full md:w-auto">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 bg-[#D4A82F] hover:bg-[#c39b28] text-stone-950 rounded-2xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Nouveau Matériel</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Bar */}
        <InventoryStatsCards items={effectiveItems} />

        {/* Filter Bar & View Switcher */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher désignation, réf, lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            {/* Filter Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
            >
              <option value="all">Tous les États</option>
              <option value="neuf">Neuf</option>
              <option value="bon_etat">Bon état</option>
              <option value="usage">Usagé / Moyen</option>
              <option value="endommage">Endommagé</option>
              <option value="en_reparation">En réparation</option>
              <option value="hors_service">Hors service</option>
            </select>

            {/* Filter Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
            >
              <option value="all">Toutes les Catégories</option>
              <option value="Matériel Informatique">Matériel Informatique</option>
              <option value="Mobilier & Bureau">Mobilier & Bureau</option>
              <option value="Outillage">Outillage Chantier</option>
              <option value="Véhicules">Véhicules & Transport</option>
              <option value="Téléphonie">Téléphonie & Réseaux</option>
            </select>

            {/* Filter Location */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
            >
              <option value="all">Tous les Emplacements</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Mode Switcher */}
          <div className="flex items-center justify-end bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shrink-0 self-end lg:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Table className="h-3.5 w-3.5" /> Tableau
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cartes
            </button>
          </div>
        </div>

        {/* Main Table / Cards view */}
        {viewMode === 'table' ? (
          <InventoryTableView
            items={filtered}
            onOpenHistory={(item) => setHistoryItem(item)}
            onOpenAssign={(item) => setAssignItem(item)}
            onEditItem={(item) => {
              setEditingItem(item);
              setShowCreateModal(true);
            }}
            onDeleteItem={handleDeleteItem}
            onSelectItem={(item) => setSelectedDetailItem(item)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onSelect={(item) => setSelectedDetailItem(item)}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}

      {/* 1. Create / Edit Modal */}
      <InventoryCreateModal
        isOpen={showCreateModal}
        editingItem={editingItem}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSaveItem}
      />

      {/* 2. Detail Drawer */}
      <InventoryDetailDrawer
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        onOpenAssign={() => {
          if (selectedDetailItem) {
            setAssignItem(selectedDetailItem);
            setSelectedDetailItem(null);
          }
        }}
        onOpenReturn={() => {
          if (selectedDetailItem && selectedDetailItem.assignments && selectedDetailItem.assignments.length > 0) {
            setReturnItem(selectedDetailItem);
            setTargetAssignment(selectedDetailItem.assignments[0]);
            setSelectedDetailItem(null);
          }
        }}
        onOpenDonate={() => {
          if (selectedDetailItem) {
            setDonateItem(selectedDetailItem);
            setSelectedDetailItem(null);
          }
        }}
        onUpdateItem={(updated) => {
          handleItemUpdated(updated);
          setSelectedDetailItem(updated);
        }}
        employees={employees}
      />

      {/* 3. Donate Modal */}
      <InventoryDonateModal
        isOpen={Boolean(donateItem)}
        onClose={() => setDonateItem(null)}
        item={donateItem}
        onDonate={(updatedItem) => {
          handleItemUpdated(updatedItem);
          setDonateItem(null);
        }}
        approvedBy={currentUser?.name || 'Direction Générale'}
      />

      {/* 4. Assignments History Modal */}
      <AssignmentsHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
        onOpenReturnForAssignment={(ass) => {
          setReturnItem(historyItem);
          setTargetAssignment(ass);
        }}
      />

      {/* 5. Assign Material Modal */}
      <InventoryAssignModal
        isOpen={Boolean(assignItem)}
        onClose={() => setAssignItem(null)}
        item={assignItem}
        employees={employees}
        onAssign={handleItemUpdated}
        performedBy={currentUser?.name || 'Responsable Matériel'}
      />

      {/* 6. Return Material Modal */}
      <InventoryReturnModal
        isOpen={Boolean(returnItem)}
        onClose={() => {
          setReturnItem(null);
          setTargetAssignment(null);
        }}
        item={returnItem}
        targetAssignment={targetAssignment}
        onReturn={handleItemUpdated}
        recordedBy={currentUser?.name || 'Gestionnaire Stock'}
      />
    </div>
  );
}
