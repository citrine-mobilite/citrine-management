import React from 'react';
import { KeyRound, RefreshCw, Check } from 'lucide-react';

interface PointageCode16StepProps {
  code16Input: string;
  isValidatingCode16: boolean;
  onFormatCode16Input: (val: string) => void;
  onValidateCode16: () => void;
}

export const PointageCode16Step: React.FC<PointageCode16StepProps> = ({
  code16Input,
  isValidatingCode16,
  onFormatCode16Input,
  onValidateCode16,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-1 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <KeyRound className="h-3 w-3" /> Clé de Sécurité Temporaire
        </span>
        <h4 className="text-xs font-bold text-stone-900 mt-1">
          Saisie de la clé d'accès à 16 caractères
        </h4>
        <p className="text-[11px] text-stone-500">
          Cette clé est à usage unique et valable pendant 3 minutes après sa génération par le responsable.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-stone-600 uppercase">
          Clé d'accès à 16 caractères (Format XXXX-XXXX-XXXX-XXXX) :
        </label>
        <input
          type="text"
          value={code16Input}
          onChange={(e) => onFormatCode16Input(e.target.value)}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          maxLength={19}
          className="w-full px-4 py-3 bg-stone-50 border-2 border-stone-200 rounded-xl font-mono text-center text-sm font-bold tracking-wider text-stone-900 uppercase focus:border-[#2A7B76] focus:bg-white transition outline-none shadow-inner"
        />
      </div>

      <button
        type="button"
        onClick={onValidateCode16}
        disabled={isValidatingCode16 || code16Input.trim().length === 0}
        className="w-full py-3 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isValidatingCode16 ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Validation du code en cours...</span>
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            <span>Valider mon Badgeage par Clé</span>
          </>
        )}
      </button>
    </div>
  );
};
