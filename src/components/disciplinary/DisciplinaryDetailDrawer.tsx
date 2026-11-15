import React, { useState } from 'react';
import { X, Scale, Download, FileCheck2, UserCheck } from 'lucide-react';
import { DisciplinaryIncident, SanctionType, DisciplinaryStatus, Employee } from '../../types';
import { downloadDisciplinaryLetterPdf } from '../../services/pdfExportService';
import {
  getDisciplinaryDrawerStatusBadge,
  DisciplinaryCommentsAndHistory,
  SanctionDecisionModal,
} from './DisciplinaryDrawerSections';
import { DisciplinaryDetailIdentity } from './DisciplinaryDetailIdentity';

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
                {getDisciplinaryDrawerStatusBadge(incident.status)}
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
          <DisciplinaryDetailIdentity incident={incident} />

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

          <DisciplinaryCommentsAndHistory
            incident={incident}
            newComment={newComment}
            onNewCommentChange={setNewComment}
            onAddComment={handleAddComment}
          />
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => downloadDisciplinaryLetterPdf(incident, { id: incident.employeeId, name: incident.employeeName }, incident.sanctionType as any || 'avertissement')}
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

      {showSanctionModal && (
        <SanctionDecisionModal
          selectedSanction={selectedSanction}
          sanctionDetails={sanctionDetails}
          onSelectSanction={setSelectedSanction}
          onSanctionDetailsChange={setSanctionDetails}
          onClose={() => setShowSanctionModal(false)}
          onConfirm={handleApplySanction}
        />
      )}
    </div>
  );
};
