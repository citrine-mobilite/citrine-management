import React, { useState } from 'react';
import { ArrowLeft, Download, MapPin, Edit3, X, CheckCircle2 } from 'lucide-react';
import { DisciplinaryIncident, SanctionType, DisciplinaryStatus } from '../../types';
import { downloadDisciplinaryLetterPdf } from '../../services/pdfExportService';

interface DisciplinaryDetailViewProps {
  incident: DisciplinaryIncident;
  onBack: () => void;
  onUpdateIncident: (updated: DisciplinaryIncident) => void;
  currentUserName?: string;
  currentUserRole?: string;
}

export const DisciplinaryDetailView: React.FC<DisciplinaryDetailViewProps> = ({
  incident,
  onBack,
  onUpdateIncident,
  currentUserName = 'Conseil de Direction',
}) => {
  const [employeeResponse, setEmployeeResponse] = useState(incident.employeeResponse || '');
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [activeSanction, setActiveSanction] = useState<SanctionType | 'explications'>(
    incident.sanctionType || 'avertissement'
  );

  const handleSaveResponse = () => {
    onUpdateIncident({
      ...incident,
      employeeResponse,
      updatedAt: new Date().toISOString(),
    });
    setIsEditingResponse(false);
  };

  const handleSelectSanction = (s: SanctionType | 'explications') => {
    setActiveSanction(s);
    let sanctionType: SanctionType | undefined;
    let status: DisciplinaryStatus = 'sanctionne';

    if (s === 'explications') {
      sanctionType = 'explication_ecrite';
      status = 'en_instruction';
    } else if (s === 'classe_sans_suite') {
      sanctionType = 'classe_sans_suite';
      status = 'classe';
    } else {
      sanctionType = s as SanctionType;
      status = 'sanctionne';
    }

    onUpdateIncident({
      ...incident,
      sanctionType,
      status,
      sanctionDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col my-4">
        {/* Top Close Bar */}
        <div className="p-6 pb-2 border-b border-stone-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 rounded-md text-[10px] font-mono font-bold text-stone-700">
                {incident.id || 'DISC-2026-001'}
              </span>
              <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
                GRAVITÉ {incident.severity.toUpperCase()}
              </span>
            </div>
            <h2 className="font-serif font-bold text-xl text-stone-900 leading-snug">
              {incident.title}
            </h2>
          </div>

          <button
            onClick={onBack}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content matching Image 2 */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Salarié impliqué & Constaté par */}
          <div className="bg-stone-50/80 rounded-2xl p-4 border border-stone-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                Salarié Impliqué
              </span>
              <span className="font-bold text-stone-900 text-sm block">{incident.employeeName}</span>
              <span className="text-stone-500 text-[11px]">
                {incident.employeeRole || 'Collaborateur'} • {incident.employeeDepartment || 'Direction Générale & Stratégie'}
              </span>
            </div>

            <div>
              <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                Constaté Par
              </span>
              <span className="font-bold text-stone-900 text-sm block">{incident.reportedBy || 'Conseil de Direction'}</span>
              <span className="text-stone-500 text-[11px]">
                Date : {new Date(incident.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Section 2: Exposé des faits constatés */}
          <div className="space-y-1.5">
            <span className="text-stone-400 text-[10px] uppercase font-bold tracking-wider block">
              Exposé des faits constatés
            </span>

            <div className="p-4 bg-stone-50/60 rounded-2xl border border-stone-200/80 text-stone-800 text-xs leading-relaxed">
              {incident.description}
            </div>

            <div className="flex items-center gap-1.5 text-stone-500 text-[11px] pt-1">
              <MapPin className="h-3.5 w-3.5 text-stone-400" />
              <span>Lieu : {incident.location || 'Siège Social Douala'}</span>
            </div>
          </div>

          {/* Section 3: Explications & justificatifs du salarié */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-900 text-[10px] uppercase font-bold tracking-wider">
                Explications & Justificatifs du Salarié
              </span>
              <button
                onClick={() => setIsEditingResponse(!isEditingResponse)}
                className="text-amber-800 hover:text-amber-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="h-3 w-3" /> {isEditingResponse ? 'Annuler' : 'Modifier / Ajouter'}
              </button>
            </div>

            {isEditingResponse ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={employeeResponse}
                  onChange={(e) => setEmployeeResponse(e.target.value)}
                  placeholder="Inscrire ici les explications fournies par le salarié..."
                  className="w-full p-3 bg-white rounded-2xl border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={handleSaveResponse}
                  className="px-4 py-1.5 bg-[#2A7B76] text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Enregistrer la réponse
                </button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/80 text-stone-700 text-xs italic">
                {incident.employeeResponse || employeeResponse || "Aucune justification écrite n'a encore été enregistrée pour ce dossier."}
              </div>
            )}
          </div>

          {/* Section 4: Génération de lettres officielles A4 matching Image 2 */}
          <div className="bg-[#1c4744] text-white p-5 rounded-2xl space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
              📄 Génération de Lettres Officielles A4
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() =>
                  downloadDisciplinaryLetterPdf(
                    incident,
                    { id: incident.employeeId, name: incident.employeeName },
                    'explication'
                  )
                }
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 text-amber-200"
              >
                <Download className="h-3.5 w-3.5" /> Demande d'Explications
              </button>

              <button
                onClick={() =>
                  downloadDisciplinaryLetterPdf(
                    incident,
                    { id: incident.employeeId, name: incident.employeeName },
                    'avertissement'
                  )
                }
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 text-amber-200"
              >
                <Download className="h-3.5 w-3.5" /> Lettre d'Avertissement
              </button>

              <button
                onClick={() =>
                  downloadDisciplinaryLetterPdf(
                    incident,
                    { id: incident.employeeId, name: incident.employeeName },
                    'mise_en_demeure'
                  )
                }
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 text-amber-200"
              >
                <Download className="h-3.5 w-3.5" /> Mise en Demeure
              </button>
            </div>
          </div>

          {/* Section 5: Prononcé de la sanction disciplinaire matching Image 2 */}
          <div className="space-y-2">
            <span className="text-stone-500 text-[10px] uppercase font-bold tracking-wider block">
              Prononcé de la Sanction Disciplinaire
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleSelectSanction('explications')}
                className={`p-3 rounded-2xl font-bold text-xs border transition cursor-pointer text-center ${
                  activeSanction === 'explications' || activeSanction === 'explication_ecrite'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Explications
              </button>

              <button
                onClick={() => handleSelectSanction('avertissement')}
                className={`p-3 rounded-2xl font-bold text-xs border transition cursor-pointer text-center ${
                  activeSanction === 'avertissement'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Avertissement
              </button>

              <button
                onClick={() => handleSelectSanction('mise_en_demeure')}
                className={`p-3 rounded-2xl font-bold text-xs border transition cursor-pointer text-center ${
                  activeSanction === 'mise_en_demeure' || activeSanction === 'mise_a_pied'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Mise en Demeure
              </button>

              <button
                onClick={() => handleSelectSanction('classe_sans_suite')}
                className={`p-3 rounded-2xl font-bold text-xs border transition cursor-pointer text-center ${
                  activeSanction === 'classe_sans_suite'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Classer Sans Suite
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
