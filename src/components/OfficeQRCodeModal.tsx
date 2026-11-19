import React, { useState, useEffect } from 'react';
import { QrCode, X, Copy, Check, Download, ShieldCheck, Key, RefreshCw } from 'lucide-react';
import { generateAndDownloadQrPoster } from '../utils/qrPosterGenerator';
import { badgeCodeService } from '../services/badgeCodeService';

interface OfficeQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrSecret?: string;
  companyName?: string;
  onLaunchKiosk?: () => void;
  managerName?: string;
}

export default function OfficeQRCodeModal({
  isOpen,
  onClose,
  qrSecret = 'CITRINE-HQ-SECRET-KEY-2026',
  companyName = 'Citrine Management',
  managerName = 'Responsable',
}: OfficeQRCodeModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Rotating QR code state (30 seconds)
  const [qrToken, setQrToken] = useState('');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(30);

  // Windows-style 16-character temporary activation key (3 minutes)
  const [activationKey, setActivationKey] = useState('');
  const [keySecondsLeft, setKeySecondsLeft] = useState(0);

  // Generate Windows-style key: XXXX-XXXX-XXXX-XXXX and register in DB (3 min validity)
  const handleGenerateActivationKey = async () => {
    try {
      const codeItem = await badgeCodeService.createBadgeCode(
        managerName,
        'Clé temporaire 16 caractères générée sur place (3 min)',
        3
      );
      setActivationKey(codeItem.formattedCode);
      setKeySecondsLeft(180); // 3 minutes = 180 seconds
    } catch (e) {
      console.error('Erreur génération clé 16 car:', e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    // Set initial token
    const updateToken = () => {
      const timestampToken = Math.floor(Date.now() / 30000);
      setQrToken(`${qrSecret}-${timestampToken}`);
      setQrSecondsLeft(30);
    };
    updateToken();

    // Timers
    const interval = setInterval(() => {
      // QR countdown
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          updateToken();
          return 30;
        }
        return prev - 1;
      });

      // Key activation countdown
      setKeySecondsLeft((prev) => {
        if (prev > 0) return prev - 1;
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, qrSecret]);

  if (!isOpen) return null;

  const currentQrSecret = qrToken || qrSecret;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(currentQrSecret)}`;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(currentQrSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKey = () => {
    if (!activationKey) return;
    navigator.clipboard.writeText(activationKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-emerald-200 animate-pulse" />
            <h3 className="font-serif font-bold text-sm">Générateur de Code & Clé d'Activation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#2A7B76] tracking-wider block">
              {companyName}
            </span>
            <h4 className="text-base font-serif font-bold text-stone-900 mt-0.5">
              Pointage Sécurisé & Rotatif
            </h4>
            <p className="text-xs text-stone-500 mt-1">
              Sécurisez vos pointages en agence avec un QR Code actualisé toutes les 30 secondes ou une clé temporaire.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Left: QR Code rotatif */}
            <div className="bg-stone-50 p-4 rounded-3xl border border-stone-200/80 space-y-3">
              <span className="text-[10px] font-bold text-[#2A7B76] uppercase tracking-wider flex items-center justify-center gap-1.5">
                <RefreshCw className="h-3 w-3 animate-spin text-[#2A7B76]" />
                Expire dans {qrSecondsLeft}s
              </span>
              <div className="inline-block p-2.5 bg-white rounded-2xl border border-stone-200 shadow-xs">
                <img
                  src={qrImageUrl}
                  alt="QR Code de Présence"
                  className="w-40 h-40 mx-auto object-contain rounded-lg"
                />
              </div>
              <button
                onClick={handleCopySecret}
                className="w-full py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier Token QR'}</span>
              </button>
            </div>

            {/* Right: Windows-style 16 chars activation key */}
            <div className="bg-stone-50 p-4 rounded-3xl border border-stone-200/80 space-y-3 flex flex-col justify-between h-full">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5">
                  <Key className="h-3 w-3" /> Clé de Sécurité
                </span>
                <p className="text-[11px] text-stone-500">
                  Générez un code temporaire de 16 caractères de type clé d'activation Windows, valable 3 minutes.
                </p>
              </div>

              {activationKey ? (
                <div className="space-y-2">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-3xs text-center font-mono font-bold text-sm tracking-wider text-stone-900 animate-pulse">
                    {activationKey}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold px-1">
                    <span>Usage unique</span>
                    <span className={keySecondsLeft < 30 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}>
                      {Math.floor(keySecondsLeft / 60)}m {keySecondsLeft % 60}s restantes
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-stone-400 italic text-[11px]">
                  Aucune clé active
                </div>
              )}

              <div className="flex gap-1.5">
                <button
                  onClick={handleGenerateActivationKey}
                  className="flex-1 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-xl font-bold text-[10px] transition cursor-pointer"
                >
                  Générer une clé
                </button>
                {activationKey && (
                  <button
                    onClick={handleCopyKey}
                    className="p-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl transition cursor-pointer"
                    title="Copier la clé"
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2">
            <button
              onClick={() => generateAndDownloadQrPoster(currentQrSecret, companyName)}
              className="w-full py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Télécharger l'Affiche de Pointage (HD)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
