import React, { useRef } from 'react';
import { Image as ImageIcon, Upload, RotateCcw, CheckCircle2 } from 'lucide-react';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../../assets/citrineLogoBase64';

interface CompanyLogoCardProps {
  companyLogoBase64?: string;
  onSelectLogo: (base64: string) => void;
  onResetDefault: () => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyLogoCard: React.FC<CompanyLogoCardProps> = ({
  companyLogoBase64,
  onSelectLogo,
  onResetDefault,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Veuillez sélectionner un fichier image valide (PNG, JPEG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        onSelectLogo(base64Data);
        if (showToast) showToast('Logo officiel mis à jour.', 'success');
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Erreur lors de la lecture du fichier image.', 'error');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-stone-900">
              Logo de l'Entreprise (Conservé en Base de Données)
            </h4>
            <p className="text-[11px] text-stone-500">
              L'image (PNG, JPEG, WebP) est stockée directement dans Firestore pour un affichage pérenne.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
          <CheckCircle2 className="h-3.5 w-3.5" /> Stockage Firestore Actif
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-1">
        <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 flex items-center justify-center min-w-[200px] h-20 shadow-inner">
          <img
            src={companyLogoBase64 || CITRINE_DEFAULT_LOGO_BASE64}
            alt="Logo Entreprise"
            className="max-h-14 max-w-[190px] object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/citrine-logo.png';
            }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Téléverser un nouveau logo</span>
            </button>

            <button
              type="button"
              onClick={onResetDefault}
              className="px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
              title="Rétablir l'image officielle Citrine"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rétablir Citrine</span>
            </button>
          </div>

          <p className="text-[11px] text-stone-400">
            Format recommandé : PNG sur fond transparent ou JPEG haute résolution (résolution max 800×240 px).
          </p>
        </div>
      </div>
    </div>
  );
};
