import React from 'react';
import { History, X } from 'lucide-react';
import { AdminAccountOperation } from '../../services/adminAuditService';

interface CollaboratorAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditOpsList: AdminAccountOperation[];
}

export const CollaboratorAuditHistoryModal: React.FC<CollaboratorAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  auditOpsList,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Historique des Opérations Administratives sur les Comptes
              </h3>
              <p className="text-[11px] text-stone-500">
                Traçabilité de toutes les créations, rattachements hiérarchiques, affectations d&apos;équipe et modifications de statut.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Auteur</th>
                  <th className="py-2.5 px-3">Collaborateur Cible</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Détails de l&apos;Opération</th>
                  <th className="py-2.5 px-3 text-right">IP / Emplacement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {auditOpsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                      Aucun journal d&apos;opération administrative consigné.
                    </td>
                  </tr>
                ) : (
                  auditOpsList.map((op) => (
                    <tr key={op.id} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                        {new Date(op.timestamp).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-900 whitespace-nowrap">
                        {op.authorName}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-stone-800 whitespace-nowrap">
                        {op.targetName}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {op.operationLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 text-[11px]">{op.details}</td>
                      <td className="py-2.5 px-3 text-right text-stone-400 font-mono text-[10px] whitespace-nowrap">
                        {op.ipAddress || 'Douala, CM'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-stone-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
