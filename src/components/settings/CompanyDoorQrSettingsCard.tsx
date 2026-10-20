import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  Printer,
  Info,
  Ban,
  Save
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { generateAndDownloadQrPoster } from '../../utils/qrPosterGenerator';
import { confirmActionAlert, showSuccessAlert } from '../../utils/sweetAlert';

interface CompanyDoorQrSettingsCardProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'warning') => void;
}

export const CompanyDoorQrSettingsCard: React.FC<CompanyDoorQrSettingsCardProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const currentToken = moduleConfig?.doorQrCodeToken || moduleConfig?.qrCodeSecret || 'CITRINE_DOOR_HQ_MAIN_2026';
  const currentSiteName = moduleConfig?.doorQrSiteName || moduleConfig?.hqName || 'Entrée Principale (HQ Siège)';
  const generatedAt = moduleConfig?.doorQrCodeGeneratedAt 
    ? new Date(moduleConfig.doorQrCodeGeneratedAt).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Configuré par défaut';

  const [siteName, setSiteName] = useState(currentSiteName);
  const [requireGps, setRequireGps] = useState<boolean>(moduleConfig?.doorQrRequireGps ?? false);
  const [tokenInput, setTokenInput] = useState(currentToken);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setTokenInput(currentToken);
  }, [currentToken]);

  // URL de l'image QR Code en haute résolution
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(tokenInput || currentToken)}`;

  // Génération d'un tout nouveau token de badge d'entrée
  const handleGenerateNewDoorQr = () => {
    setIsGenerating(true);
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    const timestampHex = Date.now().toString(36).toUpperCase();
    const newToken = `CITRINE_DOOR_${randomHex}_${timestampHex}`;
    const nowIso = new Date().toISOString();

    const updated: any = {
      ...(moduleConfig || {}),
      doorQrCodeToken: newToken,
      qrCodeSecret: newToken, // Rétrocompatibilité
      doorQrCodeGeneratedAt: nowIso,
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    };

    onUpdateModuleConfig(updated);
    setTokenInput(newToken);
    setIsGenerating(false);

    if (showToast) {
      showToast(
        'Nouveau QR Code d’Entrée généré ! Pensez à réimprimer la nouvelle affiche pour la porte.',
        'success'
      );
    }
  };

  const handleApplyToken = () => {
    const newToken = tokenInput.trim() || 'CITRINE_DOOR_HQ_MAIN_2026';
    const updated: any = {
      ...(moduleConfig || {}),
      doorQrCodeToken: newToken,
      qrCodeSecret: newToken,
      doorQrCodeGeneratedAt: new Date().toISOString(),
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    };
    onUpdateModuleConfig(updated);
    if (showToast) {
      showToast('Jeton du QR Code mis à jour avec succès !', 'success');
    }
  };

  const handleInvalidateToken = async () => {
    const isConfirmed = await confirmActionAlert({
      title: 'Invalider ce QR Code ?',
      text: 'Voulez-vous vraiment invalider ce QR Code ? L\'ancien jeton cessera immédiatement de fonctionner.',
      confirmButtonText: 'Oui, invalider',
      isDestructive: true,
      icon: 'warning',
    });
    if (!isConfirmed) return;

    const revokedToken = `CITRINE_REVOKED_${Math.random().toString(36).substring(2, 8).toUpperCase()}_${Date.now()}`;
    const updated: any = {
      ...(moduleConfig || {}),
      doorQrCodeToken: revokedToken,
      qrCodeSecret: revokedToken,
      doorQrCodeGeneratedAt: new Date().toISOString(),
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    };
    onUpdateModuleConfig(updated);
    setTokenInput(revokedToken);
    if (showToast) {
      showToast('QR Code invalidé et remplacé par un nouveau jeton sécurisé.', 'success');
    }
    await showSuccessAlert('QR Code invalidé !', 'Le QR Code d\'entrée a été révoqué et renouvelé avec succès.');
  };

  const handleSaveParams = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: any = {
      ...(moduleConfig || {}),
      doorQrSiteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      doorQrRequireGps: requireGps,
    };
    onUpdateModuleConfig(updated);
    if (showToast) {
      showToast('Paramètres de la borne d’entrée enregistrés.', 'success');
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(tokenInput || currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyDirectBadgeLink = () => {
    const origin = window.location.origin;
    const directUrl = `${origin}/#clocking?token=${encodeURIComponent(tokenInput || currentToken)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPoster = () => {
    generateAndDownloadQrPoster(tokenInput || currentToken, {
      companyName: moduleConfig?.companyName || 'Citrine SARL',
      siteName: siteName.trim() || 'Entrée Principale (HQ Siège)',
      title: 'BORNE OFFICIELLE DE POINTAGE',
      subtitle: 'Scannez ce QR Code avec l’application Citrine pour valider votre badgeage.',
    });
    if (showToast) {
      showToast('Téléchargement de l’affiche HD lancé !', 'success');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden space-y-6">
      {/* En-tête de la carte */}
      <div className="p-6 bg-gradient-to-r from-teal-900/90 via-[#2A7B76] to-emerald-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs border border-white/20">
            <QrCode className="h-6 w-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                Borne Fixe d'Accueil
              </span>
              <span className="text-[10px] text-teal-200">
                Génération permanente
              </span>
            </div>
            <h3 className="font-serif font-bold text-lg text-white mt-1">
              QR Code de Badge d'Entrée & Paramètres
            </h3>
            <p className="text-xs text-teal-100 max-w-xl">
              C'est ce QR Code qui reste affiché à l'entrée de l'agence. Les collaborateurs le scannent à l'arrivée et au départ pour badger leur présence.
            </p>
          </div>
        </div>

        {/* Bouton Générer un Nouveau QR Code */}
        <button
          type="button"
          onClick={handleGenerateNewDoorQr}
          disabled={isGenerating}
          className="px-5 py-3 bg-white hover:bg-emerald-50 text-[#2A7B76] font-bold text-xs rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start md:self-auto hover:scale-[1.02] active:scale-[0.98]"
        >
          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>Générer un Nouveau QR Code</span>
        </button>
      </div>

      <div className="p-6 pt-0 space-y-6">
        {/* Token Customization Input */}
        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
          <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
            <span>Modifier / Personnaliser le Jeton du QR Code</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Modifiable avant, pendant ou après téléchargement</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Ex: CITRINE_DOOR_SECRET_2026"
              className="flex-1 px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
            />
            <button
              type="button"
              onClick={handleApplyToken}
              className="px-4 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>Appliquer</span>
            </button>
            <button
              type="button"
              onClick={handleInvalidateToken}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 border border-red-200"
              title="Invalider immédiatement ce jeton"
            >
              <Ban className="h-4 w-4 text-red-600" />
              <span>Invalider</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne Gauche : Aperçu & Téléchargement de l'affiche */}
          <div className="lg:col-span-5 flex flex-col items-center bg-stone-50 p-6 rounded-3xl border border-stone-200 text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#2A7B76] uppercase tracking-wider block">
                {moduleConfig?.companyName || 'Citrine SARL'}
              </span>
              <h4 className="font-serif font-bold text-stone-900 text-sm">
                Aperçu de la Borne d'Entrée
              </h4>
              <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1">
                <MapPin className="h-3 w-3 text-amber-600" />
                {siteName}
              </p>
            </div>

            {/* Rendu du QR Code avec cadre de borne */}
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

            {/* Informations Jeton */}
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
                  onClick={handleCopyToken}
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

            {/* Boutons d'impression et téléchargement */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={handleDownloadPoster}
                className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger l'Affiche A4 Imprimable (HD)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyDirectBadgeLink}
                className="w-full py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? 'Lien direct copié !' : 'Copier le lien direct de pointage'}</span>
              </button>
            </div>
          </div>

          {/* Colonne Droite : Paramètres et configuration */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleSaveParams} className="bg-stone-50 p-6 rounded-3xl border border-stone-200 space-y-4">
              <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#2A7B76]" />
                <span>Configuration de l'Emplacement de la Borne</span>
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Nom du site / Emplacement affiché sur l'affiche</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Ex: Entrée Principale (HQ Siège - Douala)"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#2A7B76]"
                />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="requireGps"
                  checked={requireGps}
                  onChange={(e) => setRequireGps(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-[#2A7B76] focus:ring-[#2A7B76] border-stone-300 rounded cursor-pointer"
                />
                <label htmlFor="requireGps" className="text-xs text-stone-700 cursor-pointer select-none">
                  <span className="font-bold block text-stone-900">Exiger la géolocalisation GPS lors du scan</span>
                  Vérifie que le collaborateur est physiquement à proximité de la borne lors du scan du QR Code fixe.
                </label>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Enregistrer les paramètres</span>
                </button>
              </div>
            </form>

            <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <strong className="block font-bold">Sécurité & Invalidation :</strong>
                <span>
                  Vous pouvez modifier ou invalider le jeton à tout moment (avant, pendant ou après téléchargement de l'affiche). Dès qu'un jeton est invalidé ou régénéré, les anciens QR codes imprimés ne permettent plus de valider les pointages, garantissant une sécurité maximale.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
