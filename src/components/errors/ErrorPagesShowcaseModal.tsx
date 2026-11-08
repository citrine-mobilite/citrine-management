import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Compass, Ban, Zap } from 'lucide-react';
import Error404 from './Error404';
import Error500 from './Error500';
import Error403 from './Error403';
import Error405 from './Error405';
import Error429 from './Error429';
import { haptic } from '../../services/hapticService';

interface ErrorPagesShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ErrorPagesShowcaseModal: React.FC<ErrorPagesShowcaseModalProps> = ({ isOpen, onClose }) => {
  const [selectedError, setSelectedError] = useState<'404' | '500' | '403' | '405' | '429'>('404');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-[#14423F] p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg">Centre de Test des Pages d'Erreur (404, 500, 403, 405, 429)</h3>
              <p className="text-xs text-emerald-100">Visualisez et testez les pages d'erreur Humaans de Citrine</p>
            </div>
          </div>
          <button
            onClick={() => {
              haptic.light();
              onClose();
            }}
            className="p-1.5 hover:bg-white/20 rounded-full transition cursor-pointer text-white/80 hover:text-white"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Switcher Bar */}
        <div className="p-3 bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 flex items-center justify-center gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => { haptic.light(); setSelectedError('404'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedError === '404'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>404 (Non Trouvée)</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.light(); setSelectedError('500'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedError === '500'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>500 (Erreur Serveur)</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.light(); setSelectedError('403'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedError === '403'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>403 (Accès Interdit)</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.light(); setSelectedError('405'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedError === '405'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>405 (Méthode Interdite)</span>
          </button>

          <button
            type="button"
            onClick={() => { haptic.light(); setSelectedError('429'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              selectedError === '429'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>429 (Trop de Requêtes)</span>
          </button>
        </div>

        {/* Content Preview Body */}
        <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-950 p-2 sm:p-4">
          {selectedError === '404' && <Error404 onGoHome={onClose} onGoBack={onClose} />}
          {selectedError === '500' && <Error500 onGoHome={onClose} onRetry={() => alert('Test de reconnexion serveur effectué avec succès !')} />}
          {selectedError === '403' && <Error403 onGoHome={onClose} onGoBack={onClose} />}
          {selectedError === '405' && <Error405 onGoHome={onClose} onGoBack={onClose} />}
          {selectedError === '429' && <Error429 onGoHome={onClose} onRetry={() => alert('Limiteur de débit réinitialisé !')} />}
        </div>

      </div>
    </div>
  );
};

export default ErrorPagesShowcaseModal;
