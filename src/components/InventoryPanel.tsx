import React, { useState } from 'react';
import { InventoryItem, Role, Employee, NotificationLog, AppUser, InventoryAssignment } from '../types';
import { InventoryStatsCards } from './inventory/InventoryStatsCards';
import { InventoryItemCard } from './inventory/InventoryItemCard';
import { InventoryTableView } from './inventory/InventoryTableView';
import { InventoryCreateModal } from './inventory/InventoryCreateModal';
import { AssignmentsHistoryModal } from './inventory/AssignmentsHistoryModal';
import { InventoryAssignModal } from './inventory/InventoryAssignModal';
import { InventoryReturnModal } from './inventory/InventoryReturnModal';
import { InventoryDetailDrawer } from './inventory/InventoryDetailDrawer';
import { InventoryDonateModal } from './inventory/InventoryDonateModal';
import { InventoryBanner, InventoryFiltersBar } from './inventory/InventoryHeaderAndFilters';
import { showSuccessAlert, executeOperationWithLoading, executeDeleteWithSweetAlert } from '../utils/sweetAlert';

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
}: InventoryPanelProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [assignItem, setAssignItem] = useState<InventoryItem | null>(null);
  const [returnItem, setReturnItem] = useState<InventoryItem | null>(null);
  const [targetAssignment, setTargetAssignment] = useState<InventoryAssignment | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventoryItem | null>(null);
  const [donateItem, setDonateItem] = useState<InventoryItem | null>(null);

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

  const uniqueLocations = Array.from(
    new Set(effectiveItems.map((i) => i.location).filter(Boolean))
  );

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
      <InventoryBanner
        totalItems={effectiveItems.length}
        onCreateNew={() => {
          setEditingItem(null);
          setShowCreateModal(true);
        }}
      />

      <div className="space-y-6">
        <InventoryStatsCards items={effectiveItems} />

        <InventoryFiltersBar
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          locationFilter={locationFilter}
          uniqueLocations={uniqueLocations}
          viewMode={viewMode}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onCategoryChange={setCategoryFilter}
          onLocationChange={setLocationFilter}
          onViewModeChange={setViewMode}
        />

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

      <InventoryCreateModal
        isOpen={showCreateModal}
        editingItem={editingItem}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSaveItem}
      />

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

      <AssignmentsHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
        onOpenReturnForAssignment={(ass) => {
          setReturnItem(historyItem);
          setTargetAssignment(ass);
        }}
      />

      <InventoryAssignModal
        isOpen={Boolean(assignItem)}
        onClose={() => setAssignItem(null)}
        item={assignItem}
        employees={employees}
        onAssign={handleItemUpdated}
        performedBy={currentUser?.name || 'Responsable Matériel'}
      />

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
