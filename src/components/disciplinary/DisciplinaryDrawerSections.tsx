import React from 'react';
import { X, Clock, MessageSquare, Plus, AlertCircle } from 'lucide-react';
import { DisciplinaryIncident, DisciplinaryStatus, SanctionType } from '../../types';

export function getDisciplinaryDrawerStatusBadge(status: DisciplinaryStatus) {
  switch (status) {
    case 'ouvert':
      return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">Ouvert / À examiner</span>;
    case 'en_instruction':
      return <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full text-xs font-bold">En Instruction</span>;
    case 'sanctionne':
      return <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full text-xs font-bold">Sanction Prononcée</span>;
    case 'classe':
      return <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold">Classé Sans Suite</span>;
  }
}

interface DisciplinaryCommentsAndHistoryProps {
  incident: DisciplinaryIncident;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onAddComment: (e: React.FormEvent) => void;
}

export const DisciplinaryCommentsAndHistory: React.FC<DisciplinaryCommentsAndHistoryProps> = ({
  incident,
  newComment,
  onNewCommentChange,
  onAddComment,
}) => (
  <>
    {/* Timeline & History */}
    <div className="space-y-3 border-t border-stone-100 pt-4">
      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-[#2A7B76]" /> Historique des Mesures Prises
      </h4>
      <div className="space-y-3 pl-2 border-l-2 border-stone-200">
        {(incident.history || []).map((h) => (
          <div key={h.id} className="relative pl-4 text-xs">
            <div className="absolute -left-[13px] top-1 h-3 w-3 rounded-full bg-[#2A7B76] border-2 border-white" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900">{h.action}</span>
              <span className="text-[10px] text-stone-400 font-mono">
                {new Date(h.date).toLocaleString('fr-FR')}
              </span>
            </div>
            <p className="text-stone-500 text-[11px] mt-0.5">{h.notes}</p>
            <span className="text-[10px] text-stone-400 italic">Par {h.authorName}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Observations & Comments */}
    <div className="space-y-3 border-t border-stone-100 pt-4">
      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
        <MessageSquare className="h-4 w-4 text-[#2A7B76]" /> Observations & Commentaires
      </h4>
      <div className="space-y-2">
        {(incident.comments || []).map((c) => (
          <div key={c.id} className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-400">
              <span className="font-bold text-stone-800">{c.authorName} ({c.authorRole || 'RH'})</span>
              <span>{new Date(c.timestamp).toLocaleString('fr-FR')}</span>
            </div>
            <p className="text-stone-700">{c.content}</p>
          </div>
        ))}
      </div>

      {/* New Comment Input */}
      <form onSubmit={onAddComment} className="flex gap-2">
        <input
          type="text"
          placeholder="Ajouter une observation au dossier..."
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </form>
    </div>
  </>
);

interface SanctionDecisionModalProps {
  selectedSanction: SanctionType;
  sanctionDetails: string;
  onSelectSanction: (val: SanctionType) => void;
  onSanctionDetailsChange: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const SanctionDecisionModal: React.FC<SanctionDecisionModalProps> = ({
  selectedSanction,
  sanctionDetails,
  onSelectSanction,
  onSanctionDetailsChange,
  onClose,
  onConfirm,
}) => (
  <div className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600" /> Prononcer une Décision
        </h3>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 mb-1">Type de Sanction ou Décision</label>
        <select
          value={selectedSanction}
          onChange={(e) => onSelectSanction(e.target.value as SanctionType)}
          className="w-full p-2.5 text-xs bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-[#2A7B76] outline-none"
        >
          <option value="avertissement">Avertissement Écrit Officiel</option>
          <option value="rappel_a_l_ordre">Rappel à l'Ordre Verbal / Écrit</option>
          <option value="explication_ecrite">Demande d'Explication Complémentaire</option>
          <option value="mise_en_demeure">Mise en Demeure</option>
          <option value="mise_a_pied">Mise à Pied Disciplinaire</option>
          <option value="licenciement_faute">Licenciement Disciplinaire</option>
          <option value="classe_sans_suite">Classé Sans Suite (Absence de faute)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-700 mb-1">Motif détaillé de la décision</label>
        <textarea
          rows={3}
          placeholder="Explications des motifs retenus pour motiver la sanction ou le classement..."
          value={sanctionDetails}
          onChange={(e) => onSanctionDetailsChange(e.target.value)}
          className="w-full p-2.5 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md"
        >
          Confirmer la Décision
        </button>
      </div>
    </div>
  </div>
);
