import React from 'react';
import { Camera, RefreshCw, QrCode, Check, Upload, CheckCircle2 } from 'lucide-react';

interface PointageQrScannerStepProps {
  currentStep: 'scan_door' | 'scan_dynamic';
  officialSiteName: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isProcessingDetection: boolean;
  isCapturingGps: boolean;
  detectedQrCode: string | null;
  manualTokenInput: string;
  setManualTokenInput: (val: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onProcessScannedQrCode: (raw: string) => void;
  onResetScan: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSetActionError: (err: string | null) => void;
}

export const PointageQrScannerStep: React.FC<PointageQrScannerStepProps> = ({
  currentStep,
  officialSiteName,
  videoRef,
  isProcessingDetection,
  isCapturingGps,
  detectedQrCode,
  manualTokenInput,
  setManualTokenInput,
  fileInputRef,
  onProcessScannedQrCode,
  onResetScan,
  onImageUpload,
  onSetActionError,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-center space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <Camera className="h-3 w-3" /> Scanner en Direct Actif
        </span>
        <p className="text-xs text-stone-600 font-medium">
          {currentStep === 'scan_door'
            ? `Pointez la caméra vers l'affiche collée à l'entrée (${officialSiteName}).`
            : "Pointez la caméra vers le QR Code sur l'écran du responsable."}
        </p>
      </div>

      {/* Viseur Caméra */}
      <div className="relative aspect-square max-h-[250px] mx-auto bg-stone-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-stone-300 shadow-inner">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {!isProcessingDetection && (
          <div className="absolute inset-x-6 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
        )}

        <div
          className={`absolute inset-0 pointer-events-none border-2 rounded-2xl m-6 transition-all duration-300 ${
            isProcessingDetection
              ? 'border-emerald-400 bg-emerald-500/20 scale-105'
              : 'border-emerald-400/80 animate-pulse'
          }`}
        />

        <div className="absolute bottom-2.5 bg-black/75 backdrop-blur-xs text-white text-[11px] px-3.5 py-1.5 rounded-full font-medium flex items-center gap-2">
          {isProcessingDetection ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-spin" />
              <span className="text-emerald-200 font-bold">QR Code Détecté ! Validation du badgeage...</span>
            </>
          ) : isCapturingGps ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-300" />
              <span>Vérification de localisation...</span>
            </>
          ) : (
            <>
              <QrCode className="h-3.5 w-3.5 text-emerald-400" />
              <span>Alignez le QR Code au centre pour badger</span>
            </>
          )}
        </div>
      </div>

      {/* Carte de confirmation */}
      {detectedQrCode && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>QR Code détecté avec succès !</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-700 bg-white p-2 rounded-xl border border-emerald-200 truncate">
            {detectedQrCode}
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onProcessScannedQrCode(detectedQrCode)}
              disabled={isProcessingDetection}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>Confirmer et badger</span>
            </button>
            <button
              type="button"
              onClick={onResetScan}
              className="px-3.5 py-2.5 bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs rounded-xl border border-stone-200 transition cursor-pointer"
            >
              Recommencer
            </button>
          </div>
        </div>
      )}

      {/* Téléversement photo */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl border border-stone-200 transition cursor-pointer flex items-center justify-center gap-2"
          title="Téléverser une photo nette du QR Code affiché à la porte"
        >
          <Upload className="h-4 w-4 text-[#2A7B76]" />
          <span>Téléverser une Photo du QR Code Officiel</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onImageUpload}
        />
      </div>

      {/* Entrée manuelle de repli */}
      <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
        <label className="block text-[10px] font-bold text-stone-600 uppercase">
          Ou saisie du jeton de sécurité (inscrit sous le QR Code officiel) :
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualTokenInput}
            onChange={(e) => setManualTokenInput(e.target.value)}
            placeholder={currentStep === 'scan_door' ? 'Ex: Saisissez le jeton officiel...' : 'CITRINE-DYN-...'}
            className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs font-mono outline-none focus:border-[#2A7B76]"
          />
          <button
            type="button"
            onClick={() => {
              const trimmed = manualTokenInput.trim();
              if (!trimmed) {
                onSetActionError('Veuillez saisir le jeton inscrit sous le QR Code officiel.');
                return;
              }
              onProcessScannedQrCode(trimmed);
            }}
            disabled={isProcessingDetection}
            className="px-4 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};
