import React, { useState } from 'react';
import { X, Package, Tag, MapPin, QrCode, User, RotateCcw, Heart, Clock, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';
import { InventoryItem, Employee, InventoryItemStatus } from '../../types';

interface InventoryDetailDrawerProps {
  item: InventoryItem | null;
  onClose: () => void;
  onOpenAssign: () => void;
  onOpenReturn: () => void;
  onOpenDonate: () => void;
  onUpdateItem: (updated: InventoryItem) => void;
  employees: Employee[];
}

export const InventoryDetailDrawer: React.FC<InventoryDetailDrawerProps> = ({
  item,
  onClose,
  onOpenAssign,
  onOpenReturn,
  onOpenDonate,
  onUpdateItem,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<InventoryItemStatus>(item?.status || 'bon_etat');
  const [statusNote, setStatusNote] = useState('');

  if (!item) return null;

  const currentAssignedQty = (item.assignments || []).reduce((acc, a) => acc + a.quantity, 0);
  const availableQty = Math.max(0, item.quantity - currentAssignedQty);

  const handleUpdateStatus = () => {
    const updatedMovement = {
      id: `mov-${Date.now()}`,
      type: 'maintenance' as const,
      date: new Date().toISOString().split('T')[0],
      quantity: item.quantity,
      performedBy: 'Responsable Maintenance',
      notes: statusNote || `Changement d'état du matériel vers : ${newStatus}`,
    };

    onUpdateItem({
      ...item,
      status: newStatus,
      movements: [...(item.movements || []), updatedMovement],
      updatedAt: new Date().toISOString(),
    });

    setShowStatusModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2A7B76] rounded-2xl text-white">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-stone-400 font-mono">Réf: {item.reference || 'SANS-REF'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {item.category || 'Matériel'}
                </span>
              </div>
              <h3 className="font-bold text-base text-white">{item.designation}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-white rounded-xl">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Actions Header Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onOpenAssign}
              disabled={availableQty <= 0}
              className="p-3 bg-[#2A7B76] hover:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <User className="h-4 w-4" /> Affecter
            </button>
            <button
              onClick={onOpenReturn}
              disabled={(item.assignments || []).length === 0}
              className="p-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" /> Restituer
            </button>
            <button
              onClick={onOpenDonate}
              className="p-3 bg-purple-700 hover:bg-purple-800 text-white rounded-2xl text-xs font-bold transition shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Heart className="h-4 w-4" /> Faire un Don
            </button>
          </div>

          {/* Overview KPI Card & QR Code */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="grid grid-cols-2 gap-4 text-xs w-full">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Quantités</span>
                <p className="font-bold text-stone-900 text-sm">
                  {availableQty} dispo / {item.quantity} total
                </p>
                <p className="text-stone-500 text-[11px]">{currentAssignedQty} actuellement en prêt</p>
              </div>

              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">État & Valeur</span>
                <span className="font-bold text-stone-900 capitalize block">{item.status.replace('_', ' ')}</span>
                <p className="text-emerald-800 font-mono font-bold text-[11px]">
                  {item.unitPrice ? `${item.unitPrice.toLocaleString('fr-FR')} FCFA / unité` : 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Numéro de Série</span>
                <p className="font-mono text-stone-800 font-bold">{item.serialNumber || 'Non renseigné'}</p>
              </div>

              <div>
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Emplacement</span>
                <p className="font-medium text-stone-800 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-stone-400" /> {item.location}
                </p>
              </div>
            </div>

            {/* QR Code Identification Mockup */}
            <div className="p-3 bg-white rounded-2xl border border-stone-200 text-center shrink-0 space-y-1">
              <QrCode className="h-16 w-16 text-stone-800 mx-auto" />
              <span className="text-[9px] font-mono font-bold text-stone-500 block">{item.reference}</span>
            </div>
          </div>

          {/* Active Assignments */}
          <div className="space-y-3 border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <User className="h-4 w-4 text-[#2A7B76]" /> Affectations Actives ({item.assignments?.length || 0})
              </h4>
              <button
                onClick={() => setShowStatusModal(true)}
                className="text-xs text-[#2A7B76] hover:underline font-bold"
              >
                Changer l'État Général
              </button>
            </div>

            {(!item.assignments || item.assignments.length === 0) ? (
              <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-xl">
                Aucune affectation active. Tout le matériel est disponible au magasin.
              </p>
            ) : (
              <div className="space-y-2">
                {item.assignments.map((a) => (
                  <div key={a.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{a.employeeName}</span>
                      <p className="text-[10px] text-stone-500">Affecté le {a.assignedAt} • Qté: {a.quantity}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                      En prêt
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History of Restitutions */}
          {item.returns && item.returns.length > 0 && (
            <div className="space-y-3 border-t border-stone-100 pt-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-emerald-800" /> Historique des Restitutions
              </h4>
              <div className="space-y-2">
                {item.returns.map((r) => (
                  <div key={r.id} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-emerald-900">{r.employeeName}</span>
                      <span className="font-mono text-stone-400">{r.returnDate}</span>
                    </div>
                    <p className="text-stone-700">
                      État au retour : <span className="font-bold capitalize">{r.returnCondition.replace('_', ' ')}</span>
                    </p>
                    {r.observations && <p className="text-stone-500 italic text-[11px]">"{r.observations}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Movements Log Timeline */}
          <div className="space-y-3 border-t border-stone-100 pt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#2A7B76]" /> Journal Chronologique des Mouvements
            </h4>
            <div className="space-y-2 pl-2 border-l-2 border-stone-200">
              {(item.movements || []).map((m) => (
                <div key={m.id} className="relative pl-4 text-xs">
                  <div className="absolute -left-[13px] top-1 h-3 w-3 rounded-full bg-[#2A7B76] border-2 border-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 capitalize">{m.type} ({m.quantity} un.)</span>
                    <span className="text-[10px] text-stone-400 font-mono">{m.date}</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">{m.notes}</p>
                  <span className="text-[10px] text-stone-400 italic">Par {m.performedBy}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Change Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-stone-200">
            <h3 className="font-serif font-bold text-sm text-stone-900">Mettre à jour l'État du Matériel</h3>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Nouvel État Général</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as InventoryItemStatus)}
                className="w-full p-2 text-xs bg-stone-50 rounded-xl border border-stone-200 font-bold outline-none"
              >
                <option value="neuf">Neuf</option>
                <option value="bon_etat">Bon État</option>
                <option value="usage">Usagé</option>
                <option value="endommage">Endommagé</option>
                <option value="en_reparation">En Réparation / Maintenance</option>
                <option value="hors_service">Hors Service</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Motif de dégradation / Note</label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Ex: Choc subi lors de l'utilisation sur chantier..."
                className="w-full p-2 text-xs bg-stone-50 rounded-xl border border-stone-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowStatusModal(false)} className="px-3 py-1.5 text-xs text-stone-600 font-bold">
                Annuler
              </button>
              <button onClick={handleUpdateStatus} className="px-4 py-1.5 bg-[#2A7B76] text-white text-xs font-bold rounded-xl">
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
