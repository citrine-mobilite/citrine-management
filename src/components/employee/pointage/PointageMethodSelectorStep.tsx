import React from 'react';
import { DoorClosed, RefreshCw, KeyRound, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PointageMethodSelectorStepProps {
  onSelectOption: (option: 'scan_door' | 'scan_dynamic' | 'code_16') => void;
}

export const PointageMethodSelectorStep: React.FC<PointageMethodSelectorStepProps> = ({
  onSelectOption,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="text-center space-y-1">
        <span className="text-[10px] font-bold text-[#2A7B76] uppercase tracking-wider block">
          Procédure Officielle de Pointage
        </span>
        <h4 className="text-sm font-bold text-stone-900">
          Comment souhaitez-vous badger votre présence ?
        </h4>
        <p className="text-xs text-stone-500">
          Le système scanne et valide immédiatement dès que le QR Code apparaît :
        </p>
      </div>

      <div className="space-y-2.5 pt-1">
        {/* Option 1: Door QR Code */}
        <button
          type="button"
          onClick={() => onSelectOption('scan_door')}
          className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
        >
          <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
            <DoorClosed className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                1. Scanner le QR Code de l'Entrée (Porte des Locaux)
              </span>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Auto-Badge
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Pointez votre caméra vers l'affiche à l'entrée. Le scan détecte le QR Code et badge automatiquement votre présence !
            </p>
          </div>
        </button>

        {/* Option 2: Dynamic QR Code */}
        <button
          type="button"
          onClick={() => onSelectOption('scan_dynamic')}
          className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
        >
          <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                2. QR Code Dynamique (Écran Responsable)
              </span>
              <span className="text-[9px] font-bold bg-teal-100 text-[#2A7B76] px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" /> Sans GPS
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Scannez le QR Code affiché sur l'écran du manager (renouvelé toutes les 30s).
            </p>
          </div>
        </button>

        {/* Option 3: 16-character code */}
        <button
          type="button"
          onClick={() => onSelectOption('code_16')}
          className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-[#2A7B76] bg-stone-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start gap-3.5 shadow-2xs hover:shadow-sm"
        >
          <div className="p-2.5 bg-white rounded-xl border border-stone-200 group-hover:border-[#2A7B76] text-[#2A7B76] shrink-0 mt-0.5 shadow-3xs">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-stone-900 group-hover:text-[#2A7B76] transition">
                3. Saisie d'une Clé à 16 Caractères
              </span>
              <span className="text-[9px] font-bold bg-stone-200 text-stone-800 px-2 py-0.5 rounded-full shrink-0">
                Secours
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Saisissez la clé générée par votre responsable (format XXXX-XXXX-XXXX-XXXX).
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
