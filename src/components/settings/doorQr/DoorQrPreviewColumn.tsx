import React from 'react';
import { Download, Copy, Check, MapPin, ShieldCheck } from 'lucide-react';

interface DoorQrPreviewColumnProps {
  companyName: string;
  siteName: string;
  qrImageUrl: string;
  tokenInput: string;
  generatedAt: string;
  copiedToken: boolean;
  copiedLink: boolean;
  onCopyToken: () => void;
  onDownloadPoster: () => void;
  onCopyDirectBadgeLink: () => void;
}

export const DoorQrPreviewColumn: React.FC<DoorQrPreviewColumnProps> = ({
  companyName,
  siteName,
  qrImageUrl,
  tokenInput,
  generatedAt,
  copiedToken,
  copiedLink,
  onCopyToken,
  onDownloadPoster,
  onCopyDirectBadgeLink,
}) => {
  return (
    <div className="lg:col-span-5 flex flex-col items-center bg-stone-50 p-6 rounded-3xl border border-stone-200 text-center space-y-4">
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-[#2A7B76] uppercase tracking-wider block">
          {companyName}
        </span>
        <h4 className="font-serif font-bold text-stone-900 text-sm">
          Aperçu de la Borne d'Entrée
        </h4>
        <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1">
          <MapPin className="h-3 w-3 text-amber-600" />
          {siteName}
        </p>
      </div>

      <div className="relative p-4 bg-white rounded-2xl border-2 border-[#2A7B76]/30 shadow-md">
        <img
          src={qrImageUrl}
          alt="QR Code de Badge d'Entrée"
          className="w-48 h-48 mx-auto object-contain rounded-lg"
        />
        <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="Borne Active">
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="w-full bg-white p-3 rounded-xl border border-stone-200 text-left space-y-1">
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">
          Jeton actif du QR Code :
        </span>
        <div className="flex items-center justify-between gap-2">
          <code className="text-[11px] font-mono font-bold text-stone-800 truncate">
            {tokenInput}
          </code>
          <button
            type="button"
            onClick={onCopyToken}
            className="p-1 hover:bg-stone-100 rounded-md text-stone-600 transition cursor-pointer"
            title="Copier le jeton"
          >
            {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <span className="text-[10px] text-stone-400 block pt-0.5">
          Dernière génération : {generatedAt}
        </span>
      </div>

      <div className="w-full space-y-2">
        <button
          type="button"
          onClick={onDownloadPoster}
          className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span>Télécharger l'Affiche A4 Imprimable (HD)</span>
        </button>

        <button
          type="button"
          onClick={onCopyDirectBadgeLink}
          className="w-full py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
        >
          {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          <span>{copiedLink ? 'Lien direct copié !' : 'Copier le lien direct de pointage'}</span>
        </button>
      </div>
    </div>
  );
};
