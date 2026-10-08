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

interface InventoryPanelProps {
  inventoryItems: InventoryItem[];
  onUpdateInventoryItems: (items: InventoryItem[]) => void;
  currentRole?: Role;
  currentUser?: AppUser | null;
  employees?: Employee[];
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

// Initial items matching screenshot 1 if empty
const INITIAL_DEMO_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    designation: 'Ordinateur Portable Dell Latitude 5420',
    reference: 'INV-2026-001',
    serialNumber: 'SN-DLL-5420-X1',
    category: 'Matériel Informatique',
    quantity: 9,
    unitPrice: 650000,
    location: 'Bureau Principal HQ - Salle 102',
    status: 'neuf',
    quantitiesByStatus: { neuf: 4, bon_etat: 1, endommage: 1, en_reparation: 1, hors_service: 2 },
    notes: 'Matériel configuré avec suite bureautique et antivirus entreprise.',
    assignments: [
      {
        id: 'ass-1',
        employeeId: 'emp-1',
        employeeName: 'Kenne Londo Doleres',
        quantity: 1,
        status: 'usage',
        assignedAt: '3 août 2026, 09:03',
        notes: 'Dotation poste de travail',
      },
    ],
    movements: [],
    returns: [],
    donations: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-03',
  },
  {
    id: 'inv-2',
    designation: 'Fauteuil de bureau ergonomique Mesh Black',
    reference: 'INV-2026-002',
    serialNumber: 'SN-MOB-9921',
    category: 'Mobilier & Bureau',
    quantity: 12,
    unitPrice: 85000,
    location: 'Bureau Principal HQ - Open Space',
    status: 'bon_etat',
    quantitiesByStatus: { bon_etat: 12 },
    notes: 'Acheté en 2025, parfait état de marche.',
    assignments: [],
    movements: [],
    returns: [],
    donations: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'inv-3',
    designation: 'Vidéoprojecteur Epson Full HD EB-FH52',
    reference: 'INV-2026-003',
    serialNumber: 'SN-EPS-FH52',
    category: 'Matériel Informatique',
    quantity: 2,
    unitPrice: 380000,
    location: 'Salle de Réunion Douala',
    status: 'usage',
    quantitiesByStatus: { usage: 2 },
    notes: 'Lampe vérifiée en Juin 2026.',
    assignments: [],
    movements: [],
    returns: [],
    donations: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'inv-4',
    designation: 'Imprimante Multifonction HP LaserJet Pro',
    reference: 'INV-2026-004',
    serialNumber: 'SN-HP-LJP400',
    category: 'Matériel Informatique',
    quantity: 1,
    unitPrice: 240000,
    location: 'Atelier Maintenance Akwa',
    status: 'en_reparation',
    quantitiesByStatus: { en_reparation: 1 },
    notes: "Changement du rouleau d'entraînement de papier.",
    assignments: [],
    movements: [],
    returns: [],
    donations: [],
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
];

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

  // Ensure initial items exist
  const effectiveItems = inventoryItems.length > 0 ? inventoryItems : INITIAL_DEMO_ITEMS;

  const handleSaveItem = (item: InventoryItem) => {
    const exists = effectiveItems.some((i) => i.id === item.id);
    if (exists) {
      onUpdateInventoryItems(effectiveItems.map((i) => (i.id === item.id ? item : i)));
    } else {
      onUpdateInventoryItems([item, ...effectiveItems]);
    }
    if (showToast) showToast('Matériel enregistré avec succès.');
  };

  const handleDeleteItem = (id: string) => {
    onUpdateInventoryItems(effectiveItems.filter((i) => i.id !== id));
    if (showToast) showToast('Élément d\'inventaire supprimé.');
  };

  const handleItemUpdated = (updated: InventoryItem) => {
    onUpdateInventoryItems(effectiveItems.map((i) => (i.id === updated.id ? updated : i)));
    if (historyItem?.id === updated.id) setHistoryItem(updated);
    if (showToast) showToast('Inventaire mis à jour.');
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
      {/* Clean Banner with Aligned Primary Action */}
      <div className="bg-[#2A7B76] rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Package className="h-6 w-6 text-emerald-200" />
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
            Gestion du Matériel & Inventaires
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              setEditingItem(null);
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-2xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4 text-[#2A7B76]" />
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
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((item) => (
              <InventoryItemCard
                key={item.id}
                item={item}
                onSelect={(item) => setHistoryItem(item)}
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

      {/* 2. Screenshot 2: Assignments History Modal */}
      <AssignmentsHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
        onOpenReturnForAssignment={(ass) => {
          setReturnItem(historyItem);
          setTargetAssignment(ass);
        }}
      />

      {/* 3. Screenshot 4: Assign Material Modal */}
      <InventoryAssignModal
        isOpen={Boolean(assignItem)}
        onClose={() => setAssignItem(null)}
        item={assignItem}
        employees={employees}
        onAssign={handleItemUpdated}
        performedBy={currentUser?.name || 'Responsable Matériel'}
      />

      {/* 4. Screenshot 3: Return Material Modal */}
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
