import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { generateAndDownloadQrPoster } from '../../utils/qrPosterGenerator';

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
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // URL de l'image QR Code en haute résolution
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=12&data=${encodeURIComponent(currentToken)}`;

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
    setIsGenerating(false);

    if (showToast) {
      showToast(
        'Nouveau QR Code d’Entrée généré ! Pensez à réimprimer la nouvelle affiche pour la porte.',
        'success'
      );
    }
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
    navigator.clipboard.writeText(currentToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyDirectBadgeLink = () => {
    const origin = window.location.origin;
    const directUrl = `${origin}/#clocking?token=${encodeURIComponent(currentToken)}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPoster = () => {
    generateAndDownloadQrPoster(currentToken, {
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
              QR Code de Badge d'Entrée (Porte des Locaux)
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
          <span>Générer un Nouveau QR Code d'Entrée</span>
        </button>
      </div>

      <div className="p-6 pt-0 space-y-6">
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
                  {currentToken}
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
                className="w-full py-2 bg-white hover:bg-stone-100 text-stone-700 font-semibold text-[11px] rounded-xl border border-stone-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <ExternalLink className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Lien copié !' : 'Copier le Lien Web Direct'}</span>
              </button>
            </div>
          </div>

          {/* Colonne Droite : Configuration & Explications Métier */}
          <div className="lg:col-span-7 space-y-5">
            {/* Formulaire de personnalisation */}
            <form onSubmit={handleSaveParams} className="bg-stone-50/80 p-5 rounded-3xl border border-stone-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
                <Sparkles className="h-4 w-4 text-[#2A7B76]" />
                <h4 className="font-serif font-bold text-sm text-stone-900">
                  Paramètres de la Borne d'Entrée
                </h4>
              </div>

              {/* Nom du site ou de la porte */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#2A7B76]" /> Nom du site ou de la porte d'entrée :
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Ex: Entrée Principale (HQ Akwa), Porte Accueil, Agence Bastos"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
                />
                <p className="text-[10px] text-stone-500">
                  Ce libellé apparaîtra sur l'affiche imprimée et dans l'historique des présences des salariés.
                </p>
              </div>

              {/* Option Exiger GPS ou Non */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-900 block cursor-pointer" onClick={() => setRequireGps(!requireGps)}>
                      Exiger la concordance GPS lors du scan
                    </label>
                    <p className="text-[11px] text-stone-500">
                      {requireGps 
                        ? 'Le téléphone de l’employé doit être géolocalisé dans le rayon du siège en plus de viser le QR Code.' 
                        : 'Recommandé : Désactivé. La présence physique devant le QR Code imprimé à l’entrée suffit pour valider (évite les blocages si le GPS capte mal en intérieur).'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireGps}
                    onChange={(e) => setRequireGps(e.target.checked)}
                    className="h-5 w-5 text-[#2A7B76] rounded cursor-pointer accent-[#2A7B76]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  Enregistrer les paramètres de la borne
                </button>
              </div>
            </form>

            {/* Guide d'installation physique de la borne */}
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Info className="h-4 w-4 text-amber-700 shrink-0" />
                <span>Procédure pour le Responsable & l'Accueil :</span>
              </div>
              <ul className="text-xs text-stone-700 space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-stone-900">1. Générer le QR Code :</strong> Cliquez sur le bouton « Générer un Nouveau QR Code d'Entrée » ci-dessus.
                </li>
                <li>
                  <strong className="text-stone-900">2. Télécharger l'affiche :</strong> Cliquez sur « Télécharger l'Affiche A4 Imprimable (HD) » pour obtenir le document haute définition.
                </li>
                <li>
                  <strong className="text-stone-900">3. Placarder à l'entrée :</strong> Imprimez l'affiche et collez-la à hauteur des yeux sur la porte d'entrée ou au comptoir d'accueil.
                </li>
                <li>
                  <strong className="text-stone-900">4. Badgeage immédiat :</strong> Les collaborateurs ouvrent leur espace personnel Citrine, cliquent sur « Pointage Quotidien » et visent ce QR Code avec leur caméra : leur badgeage est validé automatiquement !
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CompanyDoorQrSettingsCard;
