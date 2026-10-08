import React, { useState } from 'react';
import { X, Scale, Clock, MessageSquare, Plus, Download, ShieldCheck, AlertCircle, FileCheck2, UserCheck } from 'lucide-react';
import { DisciplinaryIncident, SanctionType, DisciplinaryStatus, Employee } from '../../types';
import { downloadDisciplinaryLetterPdf } from '../../services/pdfExportService';

interface DisciplinaryDetailDrawerProps {
  incident: DisciplinaryIncident | null;
  onClose: () => void;
  onUpdateIncident: (updated: DisciplinaryIncident) => void;
  currentUserRole?: string;
  currentUserName?: string;
  employees?: Employee[];
}

export const DisciplinaryDetailDrawer: React.FC<DisciplinaryDetailDrawerProps> = ({
  incident,
  onClose,
  onUpdateIncident,
  currentUserName = 'Responsable RH',
  currentUserRole = 'Administrateur RH',
}) => {
  const [newComment, setNewComment] = useState('');
  const [showSanctionModal, setShowSanctionModal] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<SanctionType>('avertissement');
  const [sanctionDetails, setSanctionDetails] = useState('');
  const [employeeResponse, setEmployeeResponse] = useState(incident?.employeeResponse || '');

  if (!incident) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const updatedComments = [
      ...(incident.comments || []),
      {
        id: `c-${Date.now()}`,
        authorName: currentUserName,
        authorRole: currentUserRole,
        content: newComment.trim(),
        timestamp: new Date().toISOString(),
      },
    ];

    const updatedHistory = [
      ...(incident.history || []),
      {
        id: `h-${Date.now()}`,
        date: new Date().toISOString(),
        action: 'Observation ajoutée',
        authorName: currentUserName,
        notes: newComment.trim(),
      },
    ];

    onUpdateIncident({
      ...incident,
      comments: updatedComments,
      history: updatedHistory,
      updatedAt: new Date().toISOString(),
    });

    setNewComment('');
  };

  const handleSaveResponse = () => {
    const updatedHistory = [
      ...(incident.history || []),
      {
        id: `h-${Date.now()}`,
        date: new Date().toISOString(),
        action: 'Explications du collaborateur enregistrées',
        authorName: currentUserName,
        notes: 'Mise à jour des réponses/explications fournies.',
      },
    ];

    onUpdateIncident({
      ...incident,
      employeeResponse,
      history: updatedHistory,
      status: incident.status === 'ouvert' ? 'en_instruction' : incident.status,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleApplySanction = () => {
    let newStatus: DisciplinaryStatus = 'sanctionne';
    if (selectedSanction === 'classe_sans_suite') {
      newStatus = 'classe';
    }

    const updatedHistory = [
      ...(incident.history || []),
      {
        id: `h-${Date.now()}`,
        date: new Date().toISOString(),
        action: `Mesure prononcée : ${selectedSanction.replace('_', ' ').toUpperCase()}`,
        authorName: currentUserName,
        notes: sanctionDetails || `Décision disciplinaire arrêtée : ${selectedSanction}`,
      },
    ];

    onUpdateIncident({
      ...incident,
      sanctionType: selectedSanction,
      sanctionDate: new Date().toISOString().split('T')[0],
      sanctionDetails,
      status: newStatus,
      history: updatedHistory,
      updatedAt: new Date().toISOString(),
    });

    setShowSanctionModal(false);
  };

  const getStatusBadge = (status: DisciplinaryStatus) => {
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-stone-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2A7B76] rounded-2xl text-white">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-stone-400 font-mono">Dossier #{incident.id.slice(-6)}</span>
                {getStatusBadge(incident.status)}
              </div>
              <h3 className="font-bold text-base text-white">{incident.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity & Context Banner */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Collaborateur</span>
              <span className="font-bold text-stone-900 text-sm">{incident.employeeName}</span>
              <p className="text-stone-500">{incident.employeeRole} • {incident.employeeDepartment}</p>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Signalé par</span>
              <span className="font-bold text-stone-800">{incident.reportedBy}</span>
              <p className="text-stone-500">{incident.reportedByRole}</p>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Date & Gravité</span>
              <span className="font-semibold text-stone-800">
                {new Date(incident.date).toLocaleDateString('fr-FR')} {incident.incidentTime && `à ${incident.incidentTime}`}
              </span>
              <div className="mt-0.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                  {incident.severity}
                </span>
              </div>
            </div>
            <div>
              <span className="text-stone-400 block text-[10px] uppercase font-bold">Règle & Lieu</span>
              <p className="font-medium text-stone-800">{incident.ruleViolated || 'Règlement Intérieur Général'}</p>
              <p className="text-stone-500">{incident.location || 'Sur site'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">Exposé des faits matériels</h4>
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap">
              {incident.description}
            </div>
          </div>

          {/* Employee Response & Explanation */}
          <div className="space-y-2 border-t border-stone-100 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-[#2A7B76]" /> Explications & Réponses fournies
              </h4>
              <button
                onClick={handleSaveResponse}
                className="text-xs text-[#2A7B76] hover:underline font-bold"
              >
                Sauvegarder les réponses
              </button>
            </div>
            <textarea
              rows={3}
              value={employeeResponse}
              onChange={(e) => setEmployeeResponse(e.target.value)}
              placeholder="Consigner ici la version ou les justifications apportées par le collaborateur lors de la demande d'explication..."
              className="w-full p-3 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {/* Applied Sanction details if any */}
          {incident.sanctionType && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-rose-700" /> Decision & Sanction Appliquée
                </span>
                <span className="text-rose-700 font-bold">{incident.sanctionDate}</span>
              </div>
              <p className="font-bold text-rose-950 text-sm capitalize">
                {incident.sanctionType.replace('_', ' ')}
              </p>
              {incident.sanctionDetails && (
                <p className="text-rose-800 text-xs">{incident.sanctionDetails}</p>
              )}
            </div>
          )}

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
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Ajouter une observation au dossier..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
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
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => downloadDisciplinaryLetterPdf(incident, { id: incident.employeeId, name: incident.employeeName }, incident.sanctionType || 'avertissement')}
            className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Lettre PDF
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSanctionModal(true)}
              className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              <FileCheck2 className="h-4 w-4" /> Statuer & Prononcer une Sanction
            </button>
          </div>
        </div>
      </div>

      {/* Sanction Modal Overlay */}
      {showSanctionModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" /> Prononcer une Décision
              </h3>
              <button onClick={() => setShowSanctionModal(false)} className="text-stone-400 hover:text-stone-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Type de Sanction ou Décision</label>
              <select
                value={selectedSanction}
                onChange={(e) => setSelectedSanction(e.target.value as SanctionType)}
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
                onChange={(e) => setSanctionDetails(e.target.value)}
                className="w-full p-2.5 text-xs bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSanctionModal(false)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleApplySanction}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Confirmer la Décision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
