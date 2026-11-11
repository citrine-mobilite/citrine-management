import React, { useState, useEffect } from 'react';
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
  Ban,
  Save,
  AlertTriangle
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { generateAndDownloadQrPoster } from '../../utils/qrPosterGenerator';

interface StaticDoorQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleConfig?: CompanyModuleConfig;
  onUpdateConfig?: (newConfig: CompanyModuleConfig) => void;
}

export const StaticDoorQrModal: React.FC<StaticDoorQrModalProps> = ({
  isOpen,
  onClose,
  moduleConfig,
  onUpdateConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isInvalidated, setIsInvalidated] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const defaultToken = moduleConfig?.doorQrCodeToken || moduleConfig?.qrCodeSecret || 'CITRINE_DOOR_HQ_MAIN_2026';

  useEffect(() => {
    if (isOpen) {
      setTokenInput(defaultToken);
      setIsInvalidated(moduleConfig?.doorQrCodeRevoked || false);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultToken, moduleConfig]);

  if (!isOpen) return null;

  const currentToken = tokenInput.trim() || defaultToken;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerateToken = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newToken = `CITRINE_DOOR_${Date.now().toString(36).toUpperCase()}_${randomSuffix}`;
    const oldToken = currentToken;
    const existingRevoked = Array.isArray(moduleConfig?.revokedDoorTokens) ? moduleConfig.revokedDoorTokens : [];
    const updatedRevoked = oldToken && !existingRevoked.includes(oldToken) ? [...existingRevoked, oldToken] : existingRevoked;

    setTokenInput(newToken);
    setIsInvalidated(false);
    
    if (onUpdateConfig && moduleConfig) {
      onUpdateConfig({
        ...moduleConfig,
        doorQrCodeToken: newToken,
        qrCodeSecret: newToken,
        doorQrCodeRevoked: false,
        revokedDoorTokens: updatedRevoked,
      });
    }
    setSuccessMsg('Nouveau jeton généré avec succès ! L\'ancien QR code est désormais définitivement invalidé.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleSaveToken = () => {
    if (onUpdateConfig && moduleConfig) {
      onUpdateConfig({
        ...moduleConfig,
        doorQrCodeToken: tokenInput,
        qrCodeSecret: tokenInput,
        doorQrCodeRevoked: isInvalidated,
      });
    }
    setSuccessMsg('Jeton mis à jour et enregistré en base.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleToggleInvalidate = () => {
    const nextState = !isInvalidated;
    setIsInvalidated(nextState);
    const existingRevoked = Array.isArray(moduleConfig?.revokedDoorTokens) ? moduleConfig.revokedDoorTokens : [];
    const updatedRevoked = nextState && currentToken && !existingRevoked.includes(currentToken)
      ? [...existingRevoked, currentToken]
      : existingRevoked;

    if (onUpdateConfig && moduleConfig) {
      onUpdateConfig({
        ...moduleConfig,
        doorQrCodeRevoked: nextState,
        revokedDoorTokens: updatedRevoked,
      });
    }
    setSuccessMsg(nextState ? 'Ce QR Code a été invalidé. Tout ancien ou actuel badge refusera l\'accès.' : 'QR Code réactivé.');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleDownloadQR = () => {
    generateAndDownloadQrPoster(currentToken, {
      companyName: moduleConfig?.companyName || 'Citrine SARL',
      siteName: moduleConfig?.doorQrSiteName || 'Entrée Principale (HQ Siège)',
      title: 'ACCÈS SÉCURISÉ CITRINE - POINTAGE',
      subtitle: isInvalidated ? 'ATTENTION : Ce QR Code a été invalidé par la direction.' : 'Scannez ce QR Code officiel pour enregistrer votre badgeage.',
    });
  };

  const handlePrint = () => {
    handleDownloadQR();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">QR Code Statique & Jeton d'Accès</h2>
              <p className="text-xs text-slate-300">Gérez, modifiez le jeton, ou invalidez le QR Code de pointage</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center space-x-2 animate-fadeIn">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isInvalidated && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <span className="font-semibold">QR Code Actuellement Invalide !</span>
                <p className="text-xs text-red-700">Les pointages avec ce jeton seront rejetés. Générez un nouveau jeton pour rétablir l'accès.</p>
              </div>
            </div>
          )}

          {/* Token editor & actions */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Jeton de sécurité du QR Code (Modifiable avant, pendant ou après téléchargement)
            </label>
            <div className="flex space-x-2">
              <input 
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Ex: CITRINE_DOOR_SECRET_2026..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveToken}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
                title="Enregistrer le jeton"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </button>
              <button
                onClick={handleRegenerateToken}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
                title="Générer un tout nouveau jeton aléatoire"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nouveau Jeton</span>
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Modifiez ce texte pour changer instantanément la signature du QR Code.</span>
              <button 
                onClick={handleToggleInvalidate}
                className={`font-semibold flex items-center space-x-1 px-2.5 py-1 rounded-md transition ${
                  isInvalidated 
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isInvalidated ? 'Réactiver ce QR Code' : 'Invalider (Révoquer)'}</span>
              </button>
            </div>
          </div>

          {/* QR Code Card Display */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-blue-50 via-indigo-50/30 to-white border border-blue-100 p-6 rounded-2xl">
            <div className={`p-4 bg-white rounded-2xl shadow-md border ${isInvalidated ? 'border-red-300 opacity-60' : 'border-blue-200'} flex flex-col items-center justify-center relative`}>
              {isInvalidated && (
                <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow">
                    Invalide / Révoqué
                  </span>
                </div>
              )}
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-3 flex flex-col justify-between text-white relative">
                <div className="flex justify-between items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xs">HQ</div>
                  <DoorClosed className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-center font-mono text-[9px] truncate px-1 opacity-80">
                  {currentToken}
                </div>
                <div className="flex justify-between items-end text-[9px] text-slate-400">
                  <span>CITRINE</span>
                  <span>SECURE</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                <MapPin className="w-3.5 h-3.5" />
                <span>{moduleConfig?.companyName || 'Siège Social Principal'}</span>
              </div>
              <h3 className="text-base font-bold text-slate-800">Badge QR Statique d'Entrée</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Imprimez ce QR Code et affichez-le à l'entrée de vos bureaux. Les employés scannent ce code pour pointer leur arrivée ou départ avec géolocalisation vérifiée.
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2 justify-center sm:justify-start">
                <button
                  onClick={handleDownloadQR}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center space-x-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger (SVG)</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={handleCopyToken}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-2 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copié !' : 'Copier le Jeton'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
