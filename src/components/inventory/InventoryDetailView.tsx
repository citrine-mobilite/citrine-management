import React, { useState } from 'react';
import { ArrowLeft, Package, MapPin, QrCode, User, RotateCcw, Heart, Clock, Tag, DollarSign, Settings2, Barcode } from 'lucide-react';
import { InventoryItem, Employee, InventoryItemStatus } from '../../types';

interface InventoryDetailViewProps {
  item: InventoryItem;
  onBack: () => void;
  onOpenAssign: () => void;
  onOpenReturn: () => void;
  onOpenDonate: () => void;
  onUpdateItem: (updated: InventoryItem) => void;
}

export const InventoryDetailView: React.FC<InventoryDetailViewProps> = ({
  item,
  onBack,
  onOpenAssign,
  onOpenReturn,
  onOpenDonate,
  onUpdateItem,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<InventoryItemStatus>(item.status || 'bon_etat');
  const [statusNote, setStatusNote] = useState('');

  const currentAssignedQty = (item.assignments || []).reduce((acc, a) => acc + a.quantity, 0);
  const availableQty = Math.max(0, item.quantity - currentAssignedQty);

  const handleUpdateStatus = () => {
    const updatedMovement = {
      id: `mov-${Date.now()}`,
      type: 'maintenance' as const,
      date: new Date().toISOString().split('T')[0],
      quantity: item.quantity,
      performedBy: 'Responsable Maintenance',
      notes: statusNote || `Mise à jour de l'état : ${newStatus}`,
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
    <div className="space-y-6">
      {/* Navigation & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au Parc Équipements
        </button>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenAssign}
            disabled={availableQty <= 0}
            className="px-4 py-2 bg-[#2A7B76] hover:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <User className="h-4 w-4" /> Affecter du Matériel
          </button>
          <button
            onClick={onOpenReturn}
            disabled={(item.assignments || []).length === 0}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Enregistrer Restitution
          </button>
          <button
            onClick={onOpenDonate}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Heart className="h-4 w-4 text-purple-700" /> Effectuer un Don
          </button>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-stone-900 rounded-3xl p-6 text-white shadow-md space-y-4 border border-stone-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-400">Réf. Interne : {item.reference || 'SANS-REF'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#2A7B76] text-white">
              {item.category || 'Équipement'}
            </span>
          </div>
          <button
            onClick={() => setShowStatusModal(true)}
            className="text-xs font-bold text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="h-3.5 w-3.5" /> Modifier l'État Général
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-serif font-bold text-white">{item.designation}</h1>
            <p className="text-xs text-stone-300 flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-stone-400" /> Emplacement : {item.location}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center px-2">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Disponible</span>
              <span className="text-lg font-bold font-mono text-emerald-300">{availableQty}</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center px-2">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">Stock Total</span>
              <span className="text-lg font-bold font-mono text-white">{item.quantity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Assignments, Returns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications Card */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#2A7B76]" /> Fiche Technique & Valeur Patrimoniale
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Numéro de Série</span>
                <span className="font-mono font-bold text-stone-900">{item.serialNumber || 'Non renseigné'}</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Valeur Unitaire</span>
                <span className="font-mono font-bold text-stone-900">
                  {item.unitPrice ? `${item.unitPrice.toLocaleString('fr-FR')} FCFA` : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">Valeur Totale Stock</span>
                <span className="font-mono font-bold text-emerald-800">
                  {item.unitPrice ? `${(item.unitPrice * item.quantity).toLocaleString('fr-FR')} FCFA` : 'N/A'}
                </span>
              </div>
            </div>

            {item.notes && (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-stone-700">
                <span className="font-bold text-stone-900 block mb-1">Observations & Remarques :</span>
                {item.notes}
              </div>
            )}
          </div>

          {/* Active Assignments */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <User className="h-4 w-4 text-[#2A7B76]" /> Employés Possédant ce Matériel ({item.assignments?.length || 0})
            </h3>

            {(!item.assignments || item.assignments.length === 0) ? (
              <p className="text-xs text-stone-400 italic bg-stone-50 p-4 rounded-2xl border border-dashed border-stone-200">
                Aucun collaborateur ne possède ce matériel actuellement. Tout le stock est disponible.
              </p>
            ) : (
              <div className="space-y-3">
                {item.assignments.map((a) => (
                  <div key={a.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-900">{a.employeeName}</span>
                      <p className="text-[11px] text-stone-500">Affecté le {a.assignedAt} • Quantité : {a.quantity}</p>
                    </div>
                    <span className="px-3 py-1 bg-stone-200 text-stone-800 rounded-xl text-xs font-bold">
                      En possession
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Restitutions History */}
          {item.returns && item.returns.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
              <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[#2A7B76]" /> Historique des Restitutions Effectuées
              </h3>
              <div className="space-y-3">
                {item.returns.map((r) => (
                  <div key={r.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-stone-900">{r.employeeName}</span>
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
        </div>

        {/* Right Col: QR Code Identification & Movement Log */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-3 text-center">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center justify-center gap-2">
              <Barcode className="h-4 w-4 text-[#2A7B76]" /> Identification & Étiquetage
            </h3>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <QrCode className="h-24 w-24 text-stone-800 mx-auto mb-2" />
              <span className="font-mono font-bold text-xs text-stone-800 block">{item.reference}</span>
              <span className="text-[10px] text-stone-400 block mt-1">Code QR d'inventaire officiel</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2A7B76]" /> Historique des Mouvements
            </h3>

            <div className="space-y-3 pl-3 border-l-2 border-stone-200">
              {(item.movements || []).map((m) => (
                <div key={m.id} className="relative pl-4 text-xs space-y-0.5">
                  <div className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-[#2A7B76] border-2 border-white" />
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
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
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
              <label className="block text-xs font-bold text-stone-700 mb-1">Motif / Dégradation constatée</label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Ex: Usure constatée lors de la révision..."
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
