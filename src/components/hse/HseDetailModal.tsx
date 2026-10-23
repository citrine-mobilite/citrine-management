import React, { useState } from 'react';
import { X, CheckCircle2, CheckSquare, Square, Pencil, Trash2 } from 'lucide-react';
import { HseIncident, HseCorrectiveAction } from '../../types';
import { getSeverityBadge, getStatusBadge, getTypeLabel } from './HseIncidentsGrid';

interface HseDetailModalProps {
  incident: HseIncident;
  isAdminOrManager: boolean;
  onClose: () => void;
  onToggleAction: (incident: HseIncident, actionId: string) => Promise<void>;
  onAddAction: (incident: HseIncident, action: HseCorrectiveAction) => Promise<void>;
  onEdit: () => void;
  onDelete?: () => Promise<void>;
}

export const HseDetailModal: React.FC<HseDetailModalProps> = ({
  incident,
  isAdminOrManager,
  onClose,
  onToggleAction,
  onAddAction,
  onEdit,
  onDelete,
}) => {
  const [newActionText, setNewActionText] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newActionDeadline, setNewActionDeadline] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAdd = async () => {
    if (!newActionText) return;
    const newAction: HseCorrectiveAction = {
      id: `act-${Date.now()}`,
      action: newActionText,
      assigneeName: newActionAssignee || 'Responsable HSE',
      deadline: newActionDeadline || new Date().toISOString().split('T')[0],
      isCompleted: false,
    };
    await onAddAction(incident, newAction);
    setNewActionText('');
    setNewActionAssignee('');
    setNewActionDeadline('');
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'incident ${incident.reference} ?`)) {
      setIsDeleting(true);
      try {
        await onDelete();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const completedCount = (incident.correctiveActions || []).filter((a) => a.isCompleted).length;
  const totalCount = (incident.correctiveActions || []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-stone-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#2A7B76]">{incident.reference}</span>
              {getSeverityBadge(incident.severity)}
              {getStatusBadge(incident.status)}
            </div>
            <h3 className="text-lg font-bold text-stone-900 mt-1">{incident.title}</h3>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              {getTypeLabel(incident.type)} • {incident.site} {incident.zonePrecise ? `(${incident.zonePrecise})` : ''}
            </p>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Survenu le {incident.date || 'Non renseigné'} {incident.time ? `à ${incident.time}` : ''} {incident.reportedBy ? `• Signalé par : ${incident.reportedBy}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdminOrManager && (
              <>
                <button
                  onClick={onEdit}
                  className="p-2 text-stone-600 hover:text-[#2A7B76] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                  title="Modifier l'incident"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2 text-stone-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Supprimer l'incident"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Circumstances & facts */}
        <div className="p-4 bg-stone-50 rounded-xl space-y-2 text-xs">
          <div>
            <span className="font-bold text-stone-700">Circonstances précises :</span>
            <p className="text-stone-600 mt-0.5">{incident.description}</p>
          </div>

          {incident.victimName && (
            <div className="pt-2 border-t border-stone-200/60">
              <span className="font-bold text-stone-700">Victime / Collaborateur impliqué :</span>
              <p className="text-stone-600 mt-0.5">
                {incident.victimName} {incident.victimInjury ? `— ${incident.victimInjury}` : ''} {typeof incident.daysLost === 'number' && incident.daysLost > 0 ? `(${incident.daysLost} jours d'arrêt)` : ''}
              </p>
            </div>
          )}

          {incident.immediateActionTaken && (
            <div className="pt-2 border-t border-stone-200/60">
              <span className="font-bold text-stone-700">Mesures d'urgence prises immédiatement :</span>
              <p className="text-stone-600 mt-0.5">{incident.immediateActionTaken}</p>
            </div>
          )}

          {incident.rootCause && (
            <div className="pt-2 border-t border-stone-200/60">
              <span className="font-bold text-stone-700">Cause racine identifiée :</span>
              <p className="text-stone-600 mt-0.5">{incident.rootCause}</p>
            </div>
          )}
        </div>

        {/* CAPA Corrective Plan */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Plan d'Actions Correctives & Préventives (CAPA)
            </h4>
            <span className="text-xs text-stone-500">
              {completedCount} / {totalCount} soldées
            </span>
          </div>

          {totalCount === 0 ? (
            <p className="text-xs text-stone-400 italic bg-stone-50 p-3 rounded-lg text-center">
              Aucune action corrective enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {incident.correctiveActions?.map((action) => (
                <div
                  key={action.id}
                  onClick={() => onToggleAction(incident, action.id)}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition cursor-pointer ${
                    action.isCompleted
                      ? 'bg-emerald-50/50 border-emerald-200 text-stone-500'
                      : 'bg-white border-stone-200 text-stone-800 hover:border-[#2A7B76]'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-[#2A7B76] cursor-pointer">
                    {action.isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                  <div className="flex-1 text-xs">
                    <p
                      className={`font-medium ${
                        action.isCompleted ? 'line-through text-stone-400' : 'text-stone-800'
                      }`}
                    >
                      {action.action}
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Responsable : {action.assigneeName} • Échéance : {action.deadline}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add action */}
          {isAdminOrManager && (
            <div className="pt-2 border-t border-stone-100 flex flex-col md:flex-row items-center gap-2">
              <input
                type="text"
                placeholder="Nouvelle action corrective..."
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76] w-full"
              />
              <input
                type="text"
                placeholder="Responsable"
                value={newActionAssignee}
                onChange={(e) => setNewActionAssignee(e.target.value)}
                className="w-full md:w-32 text-xs px-3 py-2 border border-stone-200 rounded-lg"
              />
              <input
                type="date"
                value={newActionDeadline}
                onChange={(e) => setNewActionDeadline(e.target.value)}
                className="w-full md:w-32 text-xs px-3 py-2 border border-stone-200 rounded-lg"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-lg transition shrink-0 cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
