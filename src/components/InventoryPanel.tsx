import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Tag, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  XCircle, 
  Edit, 
  Trash2, 
  Layers, 
  User, 
  ChevronRight, 
  Printer, 
  Boxes,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  ArrowRightLeft,
  RotateCcw,
  History
} from 'lucide-react';
import { InventoryItem, InventoryItemStatus, InventoryAssignment, Role, Employee, NotificationLog } from '../types';

interface InventoryPanelProps {
  inventoryItems: InventoryItem[];
  onUpdateInventoryItems: (items: InventoryItem[]) => void;
  currentRole: Role;
  employees?: Employee[];
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const INVENTORY_STATUS_CONFIG: Record<InventoryItemStatus, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: React.ComponentType<any>;
  description: string;
}> = {
  neuf: {
    label: 'Neuf',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
    description: 'Matériel neuf sous garantie'
  },
  bon_etat: {
    label: 'Bon état',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: CheckCircle2,
    description: 'Parfaitement fonctionnel'
  },
  usage: {
    label: 'Usagé / Moyen',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    icon: Clock,
    description: 'Présente des traces d\'usure'
  },
  endommage: {
    label: 'Endommagé',
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: AlertCircle,
    description: 'Nécessite attention ou réparation'
  },
  en_reparation: {
    label: 'En réparation',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: Wrench,
    description: 'En cours de maintenance'
  },
  hors_service: {
    label: 'Hors service',
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-300',
    icon: XCircle,
    description: 'Inutilisable ou à remplacer'
  }
};

export const CATEGORIES_LIST = [
  'Matériel Informatique',
  'Mobilier & Bureau',
  'Outillage & Équipement',
  'Électroménager & Fournitures',
  'Véhicules & Transport',
  'Goodies & Vêtements (Polos, T-shirts, Stylos...)',
  'Autre'
];

export default function InventoryPanel({
  inventoryItems,
  onUpdateInventoryItems,
  currentRole,
  employees = [],
  onAddNotification = () => {},
  showToast = () => {}
}: InventoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Modal State for Assign Material to Employee
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningItem, setAssigningItem] = useState<InventoryItem | null>(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignQuantity, setAssignQuantity] = useState(1);
  const [assignStatus, setAssignStatus] = useState<InventoryItemStatus>('neuf');
  const [assignNotes, setAssignNotes] = useState('');

  // Modal State for Assignments History for an item
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  // Modal State for Return Material
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningItem, setReturningItem] = useState<InventoryItem | null>(null);
  const [returningAssignment, setReturningAssignment] = useState<InventoryAssignment | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnStatus, setReturnStatus] = useState<InventoryItemStatus>('bon_etat');
  const [returnNotes, setReturnNotes] = useState('');

  // Form Fields for Add / Edit
  const [designation, setDesignation] = useState('');
  const [location, setLocation] = useState('Bureau Principal HQ');
  const [category, setCategory] = useState('Matériel Informatique');
  const [reference, setReference] = useState('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Quantities per status breakdown in Add/Edit modal
  const [quantitiesState, setQuantitiesState] = useState<Record<InventoryItemStatus, number>>({
    neuf: 0,
    bon_etat: 1,
    usage: 0,
    endommage: 0,
    en_reparation: 0,
    hors_service: 0
  });

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

  const canManage = currentRole === 'Administrateur' || currentRole === 'Responsable';

  // Extract unique locations for filtering dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set<string>();
    inventoryItems.forEach(i => {
      if (i.location) locs.add(i.location);
    });
    return Array.from(locs);
  }, [inventoryItems]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalItems = inventoryItems.length;
    let totalQuantity = 0;
    let operationalCount = 0;
    let damagedOrRepairCount = 0;

    inventoryItems.forEach(item => {
      const qByStatus = (item.quantitiesByStatus || { [item.status]: item.quantity }) as Record<InventoryItemStatus, number>;
      const itemTotal = (Object.values(qByStatus) as number[]).reduce((a, b) => a + (b || 0), 0);
      totalQuantity += itemTotal;

      const op = (qByStatus.neuf || 0) + (qByStatus.bon_etat || 0);
      operationalCount += op;

      const dam = (qByStatus.endommage || 0) + (qByStatus.en_reparation || 0) + (qByStatus.hors_service || 0);
      damagedOrRepairCount += dam;
    });
    
    return {
      totalItems,
      totalQuantity,
      operationalCount,
      damagedOrRepairCount
    };
  }, [inventoryItems]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesSearch = 
        item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.reference && item.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const qByStatus = (item.quantitiesByStatus || { [item.status]: item.quantity }) as Record<InventoryItemStatus, number>;
      const matchesStatus = statusFilter === 'all' || (qByStatus[statusFilter as InventoryItemStatus] || 0) > 0 || item.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesLocation = locationFilter === 'all' || item.location === locationFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
    });
  }, [inventoryItems, searchTerm, statusFilter, categoryFilter, locationFilter]);

  const openAddModal = () => {
    setEditingItem(null);
    setDesignation('');
    setLocation('Bureau Principal HQ');
    setCategory('Matériel Informatique');
    setReference(`INV-${Date.now().toString().slice(-4)}`);
    setUnitPrice('');
    setNotes('');
    setQuantitiesState({
      neuf: 0,
      bon_etat: 0,
      usage: 0,
      endommage: 0,
      en_reparation: 0,
      hors_service: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setDesignation(item.designation);
    setLocation(item.location);
    setCategory(item.category || 'Matériel Informatique');
    setReference(item.reference || '');
    setUnitPrice(item.unitPrice ? String(item.unitPrice) : '');
    setNotes(item.notes || '');

    const qByStatus = (item.quantitiesByStatus || {
      neuf: item.status === 'neuf' ? item.quantity : 0,
      bon_etat: item.status === 'bon_etat' ? item.quantity : 0,
      usage: item.status === 'usage' ? item.quantity : 0,
      endommage: item.status === 'endommage' ? item.quantity : 0,
      en_reparation: item.status === 'en_reparation' ? item.quantity : 0,
      hors_service: item.status === 'hors_service' ? item.quantity : 0
    }) as Record<InventoryItemStatus, number>;

    setQuantitiesState({
      neuf: qByStatus.neuf || 0,
      bon_etat: qByStatus.bon_etat || 0,
      usage: qByStatus.usage || 0,
      endommage: qByStatus.endommage || 0,
      en_reparation: qByStatus.en_reparation || 0,
      hors_service: qByStatus.hors_service || 0
    });

    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (!designation.trim()) {
      showToast('Veuillez saisir la désignation du produit.', 'error');
      return;
    }

    if (!location.trim()) {
      showToast("Veuillez spécifier l'emplacement.", 'error');
      return;
    }

    const totalQty = (Object.values(quantitiesState) as number[]).reduce((a, b) => a + (b || 0), 0);
    if (totalQty <= 0) {
      showToast('Veuillez spécifier une quantité supérieure à 0 pour au moins un état.', 'error');
      return;
    }

    let primaryStatus: InventoryItemStatus = 'bon_etat';
    let maxQ = -1;
    (Object.keys(quantitiesState) as InventoryItemStatus[]).forEach(st => {
      if ((quantitiesState[st] || 0) > maxQ) {
        maxQ = quantitiesState[st] || 0;
        primaryStatus = st;
      }
    });

    const now = new Date().toISOString();
    const parsedUnitPrice = unitPrice ? parseFloat(unitPrice) : undefined;

    if (editingItem) {
      const updatedList: InventoryItem[] = inventoryItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            designation: designation.trim(),
            quantity: totalQty,
            quantitiesByStatus: { ...quantitiesState },
            status: primaryStatus,
            location: location.trim(),
            category,
            reference: reference.trim() || undefined,
            unitPrice: parsedUnitPrice,
            notes: notes.trim() || undefined,
            updatedAt: now
          };
        }
        return item;
      });

      onUpdateInventoryItems(updatedList);
      showToast('Article mis à jour avec succès.', 'success');

      onAddNotification({
        id: `notif-${Date.now()}`,
        type: 'whatsapp',
        recipient: 'Responsable Logistique / Admin',
        title: `Inventaire modifié : ${designation.trim()}`,
        content: `L'article "${designation.trim()}" (Total Qté: ${totalQty}) a été mis à jour par ${currentRole}.`,
        payload: JSON.stringify({ item: designation.trim(), totalQty, location }),
        timestamp: now
      });

      // System activity log
      onAddNotification({
        id: `notif-${Date.now()}-sys-edit`,
        type: 'system',
        recipient: 'Système',
        title: `[INVENTAIRE] Article mis à jour : ${designation.trim()}`,
        content: `L'article "${designation.trim()}" (Nouveau Total Qté: ${totalQty}, Nouvel Emplacement: ${location.trim()}) a été mis à jour par ${currentRole}.`,
        payload: JSON.stringify({ item: designation.trim(), totalQty, location }),
        timestamp: now
      });
    } else {
      const newItem: InventoryItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        designation: designation.trim(),
        quantity: totalQty,
        quantitiesByStatus: { ...quantitiesState },
        status: primaryStatus,
        location: location.trim(),
        category,
        reference: reference.trim() || `INV-${Date.now().toString().slice(-4)}`,
        unitPrice: parsedUnitPrice,
        assignments: [],
        notes: notes.trim() || undefined,
        createdAt: now,
        updatedAt: now
      };

      onUpdateInventoryItems([newItem, ...inventoryItems]);
      showToast('Nouveau produit ajouté à l\'inventaire.', 'success');

      onAddNotification({
        id: `notif-${Date.now()}`,
        type: 'whatsapp',
        recipient: 'Responsable Logistique / Admin',
        title: `Nouvel inventaire : ${designation.trim()}`,
        content: `Ajout de "${designation.trim()}" (Qté: ${totalQty}, Emplacement: ${location.trim()}) par ${currentRole}.`,
        payload: JSON.stringify(newItem),
        timestamp: now
      });

      // System activity log
      onAddNotification({
        id: `notif-${Date.now()}-sys-add`,
        type: 'system',
        recipient: 'Système',
        title: `[INVENTAIRE] Article ajouté : ${designation.trim()}`,
        content: `L'article "${designation.trim()}" (Total Qté: ${totalQty}, Catégorie: ${category}, Emplacement: ${location.trim()}) a été ajouté par ${currentRole}.`,
        payload: JSON.stringify(newItem),
        timestamp: now
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    const updatedList = inventoryItems.filter(i => i.id !== itemToDelete.id);
    onUpdateInventoryItems(updatedList);
    showToast(`"${itemToDelete.designation}" supprimé de l'inventaire.`, 'success');

    // System activity log
    onAddNotification({
      id: `notif-${Date.now()}-sys-del`,
      type: 'system',
      recipient: 'Système',
      title: `[INVENTAIRE] Article supprimé : ${itemToDelete.designation}`,
      content: `L'article "${itemToDelete.designation}" (ID: ${itemToDelete.id}) a été définitivement retiré de l'inventaire par ${currentRole}.`,
      payload: JSON.stringify(itemToDelete),
      timestamp: new Date().toISOString()
    });

    setItemToDelete(null);
  };

  // Open Assign Modal
  const openAssignModal = (item: InventoryItem) => {
    setAssigningItem(item);
    setAssignEmployeeId(employees[0]?.id || '');
    setAssignQuantity(1);
    setAssignStatus('neuf');
    setAssignNotes('');
    setIsAssignModalOpen(true);
  };

  // Open History Modal
  const openHistoryModal = (item: InventoryItem) => {
    setHistoryItem(item);
    setIsHistoryModalOpen(true);
  };

  // Confirm Assign Material to Employee
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningItem) return;

    if (!assignEmployeeId) {
      showToast('Veuillez sélectionner un employé.', 'error');
      return;
    }

    if (assignQuantity <= 0) {
      showToast('La quantité à assigner doit être supérieure à 0.', 'error');
      return;
    }

    const qByStatus = (assigningItem.quantitiesByStatus || { [assigningItem.status]: assigningItem.quantity }) as Record<InventoryItemStatus, number>;
    const availableInStatus = qByStatus[assignStatus] || 0;

    if (assignQuantity > availableInStatus) {
      showToast(`Stock insuffisant pour l'état "${INVENTORY_STATUS_CONFIG[assignStatus].label}" (Disponible: ${availableInStatus}).`, 'error');
      return;
    }

    const emp = employees.find(e => e.id === assignEmployeeId);
    const empName = emp ? emp.name : 'Collaborateur';

    const newQByStatus = { ...qByStatus };
    newQByStatus[assignStatus] = availableInStatus - assignQuantity;

    const newTotalQty = (Object.values(newQByStatus) as number[]).reduce((a, b) => a + (b || 0), 0);

    const newAssignment: InventoryAssignment = {
      id: `asn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      employeeId: assignEmployeeId,
      employeeName: empName,
      quantity: assignQuantity,
      status: assignStatus,
      assignedAt: new Date().toISOString(),
      notes: assignNotes.trim() || undefined
    };

    const existingAssignments = assigningItem.assignments || [];
    const updatedAssignments = [newAssignment, ...existingAssignments];

    const now = new Date().toISOString();
    const updatedList: InventoryItem[] = inventoryItems.map(i => {
      if (i.id === assigningItem.id) {
        return {
          ...i,
          quantity: newTotalQty,
          quantitiesByStatus: newQByStatus,
          assignments: updatedAssignments,
          assignedToId: assignEmployeeId,
          updatedAt: now
        };
      }
      return i;
    });

    onUpdateInventoryItems(updatedList);
    showToast(`${assignQuantity} unité(s) de "${assigningItem.designation}" assignée(s) à ${empName}.`, 'success');

    onAddNotification({
      id: `notif-${Date.now()}`,
      type: 'whatsapp',
      recipient: empName,
      title: `Matériel assigné : ${assigningItem.designation}`,
      content: `Bonjour ${empName},\n\nVeuillez noter l'attribution de ${assignQuantity}x "${assigningItem.designation}" (État: ${INVENTORY_STATUS_CONFIG[assignStatus].label}).`,
      payload: JSON.stringify(newAssignment),
      timestamp: now
    });

    // System activity log
    onAddNotification({
      id: `notif-${Date.now()}-sys-asn`,
      type: 'system',
      recipient: 'Système',
      title: `[INVENTAIRE] Matériel assigné : ${assigningItem.designation}`,
      content: `Attribution de ${assignQuantity}x "${assigningItem.designation}" à l'employé ${empName} par ${currentRole}. Notes: ${assignNotes || "Aucune"}.`,
      payload: JSON.stringify(newAssignment),
      timestamp: now
    });

    setIsAssignModalOpen(false);
  };

  // Open Return Modal from History
  const openReturnModal = (item: InventoryItem, assignment: InventoryAssignment) => {
    setReturningItem(item);
    setReturningAssignment(assignment);
    setReturnQuantity(assignment.quantity);
    setReturnStatus(assignment.status);
    setReturnNotes('');
    setIsReturnModalOpen(true);
  };

  // Confirm Return Material
  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningItem || !returningAssignment) return;

    if (returnQuantity <= 0 || returnQuantity > returningAssignment.quantity) {
      showToast(`La quantité restituée doit être comprise entre 1 et ${returningAssignment.quantity}.`, 'error');
      return;
    }

    const qByStatus = (returningItem.quantitiesByStatus || { [returningItem.status]: returningItem.quantity }) as Record<InventoryItemStatus, number>;
    const currentStockForStatus = qByStatus[returnStatus] || 0;

    const newQByStatus = { ...qByStatus };
    newQByStatus[returnStatus] = currentStockForStatus + returnQuantity;

    const newTotalQty = (Object.values(newQByStatus) as number[]).reduce((a, b) => a + (b || 0), 0);

    const existingAssignments = returningItem.assignments || [];
    let updatedAssignments: InventoryAssignment[] = [];

    if (returnQuantity >= returningAssignment.quantity) {
      updatedAssignments = existingAssignments.filter(a => a.id !== returningAssignment.id);
    } else {
      updatedAssignments = existingAssignments.map(a => {
        if (a.id === returningAssignment.id) {
          return {
            ...a,
            quantity: a.quantity - returnQuantity
          };
        }
        return a;
      });
    }

    const now = new Date().toISOString();
    const updatedList: InventoryItem[] = inventoryItems.map(i => {
      if (i.id === returningItem.id) {
        return {
          ...i,
          quantity: newTotalQty,
          quantitiesByStatus: newQByStatus,
          assignments: updatedAssignments,
          assignedToId: updatedAssignments.length > 0 ? updatedAssignments[0].employeeId : undefined,
          updatedAt: now
        };
      }
      return i;
    });

    onUpdateInventoryItems(updatedList);
    showToast(`Restitution de ${returnQuantity}x "${returningItem.designation}" enregistrée avec succès.`, 'success');

    onAddNotification({
      id: `notif-${Date.now()}`,
      type: 'whatsapp',
      recipient: returningAssignment.employeeName,
      title: `Restitution de matériel : ${returningItem.designation}`,
      content: `La restitution de ${returnQuantity}x "${returningItem.designation}" (État au retour: ${INVENTORY_STATUS_CONFIG[returnStatus].label}) a été validée par ${currentRole}.`,
      payload: JSON.stringify({ item: returningItem.designation, returnQuantity, returnStatus }),
      timestamp: now
    });

    // System activity log
    onAddNotification({
      id: `notif-${Date.now()}-sys-ret`,
      type: 'system',
      recipient: 'Système',
      title: `[INVENTAIRE] Matériel restitué : ${returningItem.designation}`,
      content: `Restitution de ${returnQuantity}x "${returningItem.designation}" par l'employé ${returningAssignment.employeeName} enregistrée par ${currentRole}. État au retour: ${INVENTORY_STATUS_CONFIG[returnStatus].label}.`,
      payload: JSON.stringify({ item: returningItem.designation, returnQuantity, returnStatus }),
      timestamp: now
    });

    setIsReturnModalOpen(false);
    // Refresh history item reference if history modal is open
    if (historyItem && historyItem.id === returningItem.id) {
      const refreshed = updatedList.find(i => i.id === returningItem.id);
      if (refreshed) setHistoryItem(refreshed);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#F0FAFA] rounded-3xl p-4 sm:p-5 text-stone-900 border border-cyan-200/90 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
              Module de Gestion des Inventaires
            </h1>
          </div>

          {canManage && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={openAddModal}
                className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nouveau Produit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-green-100 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Articles Référencés</span>
            <div className="p-2 rounded-xl bg-green-50 text-green-700">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-green-950">
            {stats.totalItems}
          </div>
          <p className="text-[10px] text-stone-400">Total références uniques</p>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Quantité Totale en Stock</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-teal-950">
            {stats.totalQuantity}
          </div>
          <p className="text-[10px] text-stone-400">Unités d'équipements</p>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Opérationnels (Neuf/Bon)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-950">
            {stats.operationalCount}
          </div>
          <p className="text-[10px] text-stone-400">Prêts à l'emploi</p>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 p-4 sm:p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Anomalies / Réparation</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-amber-950">
            {stats.damagedOrRepairCount}
          </div>
          <p className="text-[10px] text-stone-400">Endommagés ou en maintenance</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher désignation, réf, lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer"
            >
              <option value="all">Tous les États</option>
              <option value="neuf">Neuf</option>
              <option value="bon_etat">Bon état</option>
              <option value="usage">Usagé / Moyen</option>
              <option value="endommage">Endommagé</option>
              <option value="en_reparation">En réparation</option>
              <option value="hors_service">Hors service</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer"
            >
              <option value="all">Toutes les Catégories</option>
              {CATEGORIES_LIST.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full py-2 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer"
            >
              <option value="all">Tous les Emplacements</option>
              {uniqueLocations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Items List / Table */}
      <div className="bg-white rounded-3xl border border-green-100 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-green-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-green-600" />
            <h2 className="font-serif font-bold text-green-950 text-sm">
              Répertoire du Matériel ({filteredItems.length})
            </h2>
          </div>
          {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setLocationFilter('all');
              }}
              className="text-xs text-green-600 hover:text-green-700 font-semibold cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-green-50 text-green-400 flex items-center justify-center mx-auto">
              <Boxes className="h-6 w-6" />
            </div>
            <h3 className="font-serif font-bold text-stone-800 text-sm">Aucun produit trouvé</h3>
            <p className="text-stone-400 text-xs max-w-sm mx-auto">
              {inventoryItems.length === 0 
                ? "Aucun matériel n'est enregistré pour l'instant. Cliquez sur 'Nouveau Produit' pour commencer." 
                : "Aucun article ne correspond à vos critères de recherche."}
            </p>
            {canManage && inventoryItems.length === 0 && (
              <button
                onClick={openAddModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter un produit</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700 border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-green-100 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Désignation & Référence</th>
                  <th className="py-3.5 px-4 text-center">Stock Total</th>
                  <th className="py-3.5 px-4">Répartition par État (Neuf, Bon, Endommagé...)</th>
                  <th className="py-3.5 px-4">Emplacement</th>
                  <th className="py-3.5 px-4 text-center">Historique Attributions</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item) => {
                  const qByStatus = (item.quantitiesByStatus || { [item.status]: item.quantity }) as Record<InventoryItemStatus, number>;
                  const totalQty = (Object.values(qByStatus) as number[]).reduce((a, b) => a + (b || 0), 0);
                  const assignments = item.assignments || [];

                  return (
                    <tr key={item.id} className="hover:bg-green-50/30 transition-colors group">
                      <td className="py-4 px-6 font-medium text-stone-900">
                        <div className="space-y-0.5">
                          <div className="font-bold text-stone-900 text-xs flex items-center gap-2">
                            <span>{item.designation}</span>
                            {item.reference && (
                              <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono text-[10px]">
                                {item.reference}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-2">
                            <span>Catégorie: <strong className="text-stone-700">{item.category || 'Autre'}</strong></span>
                            {item.unitPrice ? <span>• Prix unit: <strong className="text-stone-700">{item.unitPrice.toLocaleString()} FCFA</strong></span> : null}
                          </div>
                          {item.notes && (
                            <p className="text-[11px] text-stone-500 line-clamp-1 italic">{item.notes}</p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center justify-center font-bold text-stone-900 text-xs bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200">
                          {totalQty} unité{totalQty > 1 ? 's' : ''}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {(Object.keys(INVENTORY_STATUS_CONFIG) as InventoryItemStatus[]).map(st => {
                            const count = qByStatus[st] || 0;
                            if (count <= 0) return null;
                            const cfg = INVENTORY_STATUS_CONFIG[st];
                            return (
                              <span key={st} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                <span>{cfg.label}:</span>
                                <span className="underline font-extrabold">{count}</span>
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-stone-700 font-medium text-xs">
                          <MapPin className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => openHistoryModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Voir l'historique des attributions"
                        >
                          <History className="h-3.5 w-3.5 text-green-600" />
                          <span>Historique ({assignments.length})</span>
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && (
                            <>
                              <button
                                onClick={() => openAssignModal(item)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Assigner à un employé"
                              >
                                <User className="h-3 w-3" />
                                <span>Assigner</span>
                              </button>
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
                                title="Modifier"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setItemToDelete(item)}
                                className="p-1.5 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Product with Quantities per State */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-green-100 w-full max-w-lg shadow-2xl overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-green-100 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-green-600 text-white">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-green-950 text-sm sm:text-base">
                    {editingItem ? 'Modifier le Produit' : 'Ajouter un Produit à l\'Inventaire'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 rounded-lg hover:bg-stone-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-800 flex items-center justify-between">
                  <span>Désignation du Produit *</span>
                  <span className="text-[10px] text-stone-400 font-normal">Ex: Ordinateur Dell Latitude 5420</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nom ou désignation exacte de l'article"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-medium"
                />
              </div>

              <div className="space-y-2 bg-stone-50/80 p-3.5 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-green-950 text-xs">
                    Répartition des Quantités par État *
                  </label>
                  <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                    Total: {(Object.values(quantitiesState) as number[]).reduce((a, b) => a + (b || 0), 0)} unités
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {(Object.keys(INVENTORY_STATUS_CONFIG) as InventoryItemStatus[]).map(st => {
                    const cfg = INVENTORY_STATUS_CONFIG[st];
                    return (
                      <div key={st} className="bg-white p-2 rounded-xl border border-stone-200 space-y-1 shadow-2xs">
                        <div className="font-semibold text-stone-700 text-[11px] truncate" title={cfg.label}>
                          {cfg.label}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={quantitiesState[st] !== undefined ? quantitiesState[st] : 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setQuantitiesState(prev => ({ ...prev, [st]: val }));
                          }}
                          className="w-full px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 font-bold text-center focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-green-500" />
                  <span>Emplacement *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bureau Principal HQ - Salle 102, Dépôt Akwa..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-stone-800">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer"
                  >
                    {CATEGORIES_LIST.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-stone-800">
                    Code Référence / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: INV-2026-004"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800 flex items-center justify-between">
                  <span>Prix Unitaire Estimé (FCFA)</span>
                  <span className="text-[10px] text-stone-400 font-normal">(Facultatif)</span>
                </label>
                <input
                  type="number"
                  placeholder="Ex: 450000"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Notes & Remarques
                </label>
                <textarea
                  rows={2}
                  placeholder="Remarques complémentaires, garantie ou historique de maintenance..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
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
                  {editingItem ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign Material to Employee */}
      {isAssignModalOpen && assigningItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-green-100 w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700 border-b border-green-100 pb-3">
              <div className="p-2.5 rounded-xl bg-emerald-50">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Attribuer du matériel
                </h3>
                <p className="text-[11px] text-stone-500 truncate max-w-[280px]">
                  {assigningItem.designation}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Sélectionner le Collaborateur *
                </label>
                <select
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
                >
                  <option value="">-- Choisir un employé --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.roleType})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  État du matériel à assigner *
                </label>
                <select
                  value={assignStatus}
                  onChange={(e) => setAssignStatus(e.target.value as InventoryItemStatus)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
                >
                  {(Object.keys(INVENTORY_STATUS_CONFIG) as InventoryItemStatus[]).map(st => {
                    const qByStatus = (assigningItem.quantitiesByStatus || { [assigningItem.status]: assigningItem.quantity }) as Record<InventoryItemStatus, number>;
                    const avail = qByStatus[st] || 0;
                    return (
                      <option key={st} value={st}>
                        {INVENTORY_STATUS_CONFIG[st].label} (Disponible en stock : {avail})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Quantité à assigner *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={assignQuantity}
                  onChange={(e) => setAssignQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Notes / Motif d'attribution (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dotation poste de travail, mission externe..."
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm cursor-pointer"
                >
                  Confirmer l'attribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assignments History (Most recent to oldest) */}
      {isHistoryModalOpen && historyItem && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-green-100 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-green-100 flex items-center justify-between bg-stone-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-600 text-white">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-stone-900 text-base">
                    Historique des Attributions
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {historyItem.designation} ({historyItem.reference || 'Sans réf'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 rounded-lg hover:bg-stone-200 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
              {(!historyItem.assignments || historyItem.assignments.length === 0) ? (
                <div className="py-12 text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                    <User className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-stone-800">Aucune attribution enregistrée</h4>
                  <p className="text-stone-400 text-[11px]">Ce matériel n'a pas encore été assigné à un employé.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-stone-500 italic">
                    Liste triée des attributions de la plus récente à la plus ancienne :
                  </p>
                  {[...historyItem.assignments]
                    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
                    .map((asn) => {
                      const cfg = INVENTORY_STATUS_CONFIG[asn.status] || INVENTORY_STATUS_CONFIG.bon_etat;
                      return (
                        <div key={asn.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-green-100 text-green-700">
                                <User className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 text-sm">{asn.employeeName}</span>
                                <div className="text-[10px] text-stone-400">
                                  Attribué le {new Date(asn.assignedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                {asn.quantity}x {cfg.label}
                              </span>
                              {canManage && (
                                <button
                                  onClick={() => {
                                    setIsHistoryModalOpen(false);
                                    openReturnModal(historyItem, asn);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-[11px] transition cursor-pointer shadow-2xs"
                                >
                                  Restituer
                                </button>
                              )}
                            </div>
                          </div>

                          {asn.notes && (
                            <p className="text-stone-600 text-[11px] bg-white p-2 rounded-xl border border-stone-100">
                              <strong className="text-stone-700">Motif / Notes :</strong> {asn.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-end shrink-0">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs transition cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Return Material */}
      {isReturnModalOpen && returningItem && returningAssignment && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-green-100 w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-green-700 border-b border-green-100 pb-3">
              <div className="p-2.5 rounded-xl bg-green-50">
                <RotateCcw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base">
                  Restituer du matériel
                </h3>
                <p className="text-[11px] text-stone-500">
                  {returningAssignment.employeeName} • {returningItem.designation}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReturn} className="space-y-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-stone-700 space-y-1">
                <div>Attribution initiale : <strong className="text-stone-900">{returningAssignment.quantity}x ({INVENTORY_STATUS_CONFIG[returningAssignment.status]?.label})</strong></div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Quantité restituée * (Max: {returningAssignment.quantity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={returningAssignment.quantity}
                  required
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  État au moment de la restitution *
                </label>
                <select
                  value={returnStatus}
                  onChange={(e) => setReturnStatus(e.target.value as InventoryItemStatus)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-500/20 cursor-pointer"
                >
                  {(Object.keys(INVENTORY_STATUS_CONFIG) as InventoryItemStatus[]).map(st => (
                    <option key={st} value={st}>
                      {INVENTORY_STATUS_CONFIG[st].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-stone-800">
                  Commentaires sur l'état (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: RAS, rayure légère sur le boîtier..."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition shadow-sm cursor-pointer"
                >
                  Valider la restitution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-green-100 w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-green-600">
              <div className="p-2.5 rounded-xl bg-green-50">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="font-serif font-bold text-stone-900 text-lg">
                Confirmer la suppression
              </h3>
            </div>
            <p className="text-stone-600 text-xs leading-relaxed">
              Êtes-vous sûr de vouloir supprimer <strong className="text-stone-900">"{itemToDelete.designation}"</strong> de l'inventaire ? Cette action est irréversible.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Supprimer de l'inventaire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
