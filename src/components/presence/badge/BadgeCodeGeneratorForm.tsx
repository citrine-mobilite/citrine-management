import React from 'react';
import { KeyRound, Plus, Copy, Check, ShieldCheck } from 'lucide-react';
import { BadgeSecurityCode16 } from '../../../types';

interface BadgeCodeGeneratorFormProps {
  notesInput: string;
  setNotesInput: (val: string) => void;
  isGenerating: boolean;
  onGenerateCode: () => void;
  newlyCreatedCode: BadgeSecurityCode16 | null;
  onCopyCode: (code: string, id: string) => void;
  copiedCodeId: string | null;
}

export const BadgeCodeGeneratorForm: React.FC<BadgeCodeGeneratorFormProps> = ({
  notesInput,
  setNotesInput,
  isGenerating,
  onGenerateCode,
  newlyCreatedCode,
  onCopyCode,
  copiedCodeId,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <KeyRound className="h-4 w-4 text-[#2A7B76]" /> Générateur de Code de Badgeage
          </h3>
          <p className="text-[11px] text-stone-500">
            Créez un code unique à 16 caractères pour autoriser un pointage d'urgence sans QR code.
          </p>
        </div>

        <button
          onClick={onGenerateCode}
          disabled={isGenerating}
          className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{isGenerating ? 'Génération...' : 'Générer un Code 16 Caractères'}</span>
        </button>
      </div>

      <input
        type="text"
        value={notesInput}
        onChange={(e) => setNotesInput(e.target.value)}
        placeholder="Motif ou note associée (optionnel)..."
        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
      />

      {newlyCreatedCode && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-emerald-800">
              Code généré avec succès :
            </span>
            <div className="font-mono font-extrabold text-sm text-emerald-900 tracking-wider">
              {newlyCreatedCode.formattedCode}
            </div>
          </div>
          <button
            onClick={() => onCopyCode(newlyCreatedCode.formattedCode, newlyCreatedCode.id)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0"
          >
            {copiedCodeId === newlyCreatedCode.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copiedCodeId === newlyCreatedCode.id ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
