import React, { useState, useEffect } from 'react';
import { KeyRound, X, Copy, Check, RefreshCw, Send, ShieldCheck, Clock, MessageSquare } from 'lucide-react';
import { badgeCodeService } from '../../services/badgeCodeService';

interface PersonalAccessKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerName?: string;
  companyName?: string;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const PersonalAccessKeyModal: React.FC<PersonalAccessKeyModalProps> = ({
  isOpen,
  onClose,
  managerName = 'Responsable sur place',
  companyName = 'Citrine Entreprise',
  showToast,
}) => {
  const [activationKey, setActivationKey] = useState('');
  const [keySecondsLeft, setKeySecondsLeft] = useState(180); // 3 minutes
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate 16-character Windows-style key: XXXX-XXXX-XXXX-XXXX
  const generateNewKey = async () => {
    try {
      setIsGenerating(true);
      const codeItem = await badgeCodeService.createBadgeCode(
        managerName,
        'Clé d\'accès personnelle temporaire (3 minutes)',
        3
      );
      setActivationKey(codeItem.formattedCode);
      setKeySecondsLeft(180);
    } catch (e) {
      console.error('Erreur génération clé 16 car:', e);
      if (showToast) showToast('Erreur lors de la génération de la clé.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    generateNewKey();

    const interval = setInterval(() => {
      setKeySecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!activationKey) return;
    navigator.clipboard.writeText(activationKey);
    setCopied(true);
    if (showToast) showToast('Clé d\'accès copiée dans le presse-papier !', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `🔑 *Clé d'Accès Personnelle (${companyName})*\n\nVoici votre clé temporaire pour badger votre présence :\n👉 *${activationKey}*\n\n⏱️ _Valable 3 minutes uniquement (votre position GPS sera relevée)._`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const progressPercent = Math.max(0, Math.min(100, (keySecondsLeft / 180) * 100));
  const minutes = Math.floor(keySecondsLeft / 60);
  const seconds = keySecondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 text-xs">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Clé d'Accès Personnelle (16 Caractères)
              </h3>
              <p className="text-[10px] text-stone-500">
                Clé temporaire à usage unique valable 3 minutes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-center">
          
          {/* Key Box */}
          <div className="bg-stone-50 border-2 border-dashed border-amber-300/80 rounded-3xl p-5 space-y-2 relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Code de Pointage Alphanumérique
            </span>

            <div className="font-mono text-xl sm:text-2xl font-extrabold tracking-widest text-stone-900 select-all py-1">
              {isGenerating ? 'GÉNÉRATION...' : activationKey || 'XXXX-XXXX-XXXX-XXXX'}
            </div>

            <div className="flex items-center justify-center gap-2 pt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                keySecondsLeft > 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
              }`}>
                <Clock className="h-3 w-3" />
                <span>{keySecondsLeft > 0 ? `Temps restant : ${timeFormatted}` : 'Clé expirée'}</span>
              </span>
            </div>
          </div>

          {/* Smooth Timer Bar */}
          <div className="space-y-1">
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
              <div
                className={`h-full transition-all duration-1000 ${
                  keySecondsLeft > 45 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-stone-400 font-medium">
              <span>0s</span>
              <span>180 secondes (3 min)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={handleCopy}
              disabled={!activationKey || keySecondsLeft === 0}
              className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 border border-stone-200"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-stone-600" />
                  <span>Copier la clé</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={!activationKey || keySecondsLeft === 0}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="h-4 w-4" />
              <span>Partager WhatsApp</span>
            </button>
          </div>

          {/* Regenerate Key */}
          <button
            onClick={generateNewKey}
            disabled={isGenerating}
            className="text-xs font-bold text-[#2A7B76] hover:underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Générer une nouvelle clé d'accès (3 min)</span>
          </button>

          {/* Info Notice */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 text-left text-amber-900 text-[11px] flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Le collaborateur renseigne cette clé sur son téléphone dans l'option <strong>« Clé Temporaire (3 min) »</strong>. Sa position GPS est automatiquement enregistrée pour attester de sa présence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
