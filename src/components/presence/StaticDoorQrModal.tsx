import React, { useState } from 'react';
import { 
  QrCode, 
  X, 
  Download, 
  Copy, 
  Check, 
  MapPin, 
  RefreshCw, 
  Printer, 
  ShieldCheck, 
  DoorClosed,
  ExternalLink
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { generateAndDownloadQrPoster } from '../../utils/qrPosterGenerator';

interface StaticDoorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleConfig?: CompanyModuleConfig;
  onUpdateModuleConfig?: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  onGoToSettings?: () => void;
}

export const StaticDoorQrModal: React.FC<StaticDoorQrModalProps> = ({
  isOpen,
  onClose,
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
  onGoToSettings,
}) => {
  const currentToken = moduleConfig?.doorQrCodeToken || moduleConfig?.qrCodeSecret || 'CITRINE_DOOR_HQ_MAIN_2026';
  const siteName = moduleConfig?.doorQrSiteName || moduleConfig?.hqName || 'Entrée Principale (HQ Siège)';
  const companyName = moduleConfig?.companyName || 'Citrine Entreprise';

  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // URL du QR Code statique en haute résolution
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&margin=12&data=${encodeURIComponent(currentToken)}`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const directUrl = `${origin}/#clocking?token=${encodeURIComponent(currentToken)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPoster = () => {
    generateAndDownloadQrPoster(currentToken, {
      companyName,
      siteName,
      title: 'BORNE OFFICIELLE DE POINTAGE',
      subtitle: 'Scannez ce QR Code avec l’application Citrine pour valider votre arrivée ou départ.',
    });
    if (showToast) {
      showToast('Téléchargement de l’affiche HD lancé !', 'success');
    }
  };

  const handleRegenerate = () => {
    if (!onUpdateModuleConfig) return;
    if (confirm('Voulez-vous vraiment générer un nouveau QR Code statique ? L\'ancienne affiche imprimée cessera de fonctionner et devra être remplacée.')) {
      setIsGenerating(true);
      const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
      const timestampHex = Date.now().toString(36).toUpperCase();
      const newToken = `CITRINE_DOOR_${randomHex}_${timestampHex}`;

      const updated: any = {
        ...(moduleConfig || {}),
        doorQrCodeToken: newToken,
        qrCodeSecret: newToken,
        doorQrCodeGeneratedAt: new Date().toISOString(),
      };

      onUpdateModuleConfig(updated);
      setIsGenerating(false);
      if (showToast) {
        showToast('Nouveau QR Code statique de porte généré avec succès !', 'success');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 space-y-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-[#2A7B76] to-emerald-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-200">
              <DoorClosed className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Borne Fixe / Porte
                </span>
              </div>
              <h3 className="font-serif font-bold text-base text-white mt-0.5">
                QR Code Statique d&apos;Entrée
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-center">
          <div>
            <span className="text-[11px] font-bold text-[#2A7B76] uppercase tracking-wider block">
              {companyName}
            </span>
            <p className="text-xs text-stone-500 mt-1 flex items-center justify-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-amber-600" />
              <span>Emplacement : <strong>{siteName}</strong></span>
            </p>
          </div>

          {/* QR Code Canvas Card */}
          <div className="bg-stone-50 p-5 rounded-3xl border border-stone-200/90 inline-block mx-auto relative shadow-xs">
            <div className="p-3 bg-white rounded-2xl border-2 border-[#2A7B76]/40 shadow-sm relative">
              <img
                src={qrImageUrl}
                alt="QR Code Statique de Porte"
                className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-lg"
              />
              <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="Borne Permanente Active">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 px-1 text-left">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Jeton permanent :</span>
                <code className="text-[11px] font-mono font-bold text-stone-800 truncate block max-w-[200px]">
                  {currentToken}
                </code>
              </div>
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-2 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                title="Copier le jeton"
              >
                {copiedToken ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedToken ? 'Copié' : 'Copier'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-600 max-w-sm mx-auto leading-relaxed">
            Ce QR Code est fixe : imprimez-le pour l&apos;afficher à l&apos;entrée de votre agence. Les employés le scannent à l&apos;aide de l&apos;application pour valider leur arrivée et départ.
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadPoster}
              className="w-full py-3 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-2xl transition shadow-md shadow-[#2A7B76]/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger l&apos;Affiche de Pointage A4 (HD)</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Lien copié !' : 'Copier lien direct'}</span>
              </button>

              {onUpdateModuleConfig && (
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  title="Générer une nouvelle clé de porte"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Régénérer</span>
                </button>
              )}

              {onGoToSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToSettings();
                  }}
                  className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-[#2A7B76] text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                  title="Configurer dans les Paramètres"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Paramètres</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
