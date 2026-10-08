import React, { useState } from 'react';
import { Sparkles, Upload, Image as ImageIcon, Check, RefreshCw, X, AlertCircle } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

interface CollaboratorAvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  collaboratorName: string;
  onSelectAvatar: (url: string) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

const FUNNY_AVATAR_COLLECTIONS = [
  { id: 'fun-emoji', label: 'Émojis Rigolos', style: 'fun-emoji' },
  { id: 'bottts', label: 'Robots Cools', style: 'bottts' },
  { id: 'avataaars', label: 'Personnages BD', style: 'avataaars' },
  { id: 'personas', label: 'Portraits Stylés', style: 'personas' },
  { id: 'adventurer', label: 'Aventuriers', style: 'adventurer' },
  { id: 'lorelei', label: 'Art Moderne', style: 'lorelei' },
];

export const CollaboratorAvatarPickerModal: React.FC<CollaboratorAvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  collaboratorName,
  onSelectAvatar,
  showToast,
}) => {
  const [activeMode, setActiveMode] = useState<'funny' | 'real'>('funny');
  const [selectedStyle, setSelectedStyle] = useState('fun-emoji');
  const [randomSeeds, setRandomSeeds] = useState<string[]>(() =>
    Array.from({ length: 8 }, (_, i) => `${collaboratorName || 'Citrine'}_${i + 1}_${Math.random().toString(36).substring(7)}`)
  );
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{ sizeKb: number; originalSizeKb: number } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  if (!isOpen) return null;

  const handleRegenerateFunny = () => {
    setRandomSeeds(
      Array.from({ length: 8 }, (_, i) => `${collaboratorName || 'Citrine'}_${i + 1}_${Math.random().toString(36).substring(7)}`)
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      if (showToast) showToast('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).', 'error');
      return;
    }

    try {
      setIsCompressing(true);
      const result = await compressImageFile(file, 350 * 1024);
      setUploadedPreview(result.dataUrl);
      setCompressionInfo({
        sizeKb: result.sizeKb,
        originalSizeKb: result.originalSizeKb,
      });
      if (showToast) {
        showToast(
          `Photo compressée avec succès : ${result.sizeKb} Ko (Taille initiale: ${result.originalSizeKb} Ko).`,
          'success'
        );
      }
    } catch {
      if (showToast) showToast('Erreur lors de la compression de la photo.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleConfirm = () => {
    if (activeMode === 'real' && uploadedPreview) {
      onSelectAvatar(uploadedPreview);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-stone-200 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2A7B76]" /> Photo de Profil & Avatar du Collaborateur
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveMode('funny')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'funny' ? 'bg-[#2A7B76] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Avatars Rigolos & Stylés</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('real')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeMode === 'real' ? 'bg-[#2A7B76] text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Vraie Photo (&lt; 350 Ko)</span>
          </button>
        </div>

        {/* MODE 1: AVATARS RIGOLOS */}
        {activeMode === 'funny' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {FUNNY_AVATAR_COLLECTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedStyle(c.style)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer whitespace-nowrap ${
                      selectedStyle === c.style
                        ? 'bg-[#2A7B76]/15 text-[#2A7B76] border border-[#2A7B76]/30'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRegenerateFunny}
                className="p-1.5 text-stone-500 hover:text-[#2A7B76] hover:bg-stone-100 rounded-lg cursor-pointer transition shrink-0"
                title="Générer d'autres variantes"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {randomSeeds.map((seed, idx) => {
                const url = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(seed)}`;
                const isSelected = currentAvatarUrl === url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectAvatar(url);
                      onClose();
                    }}
                    className={`p-2 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center justify-center gap-1.5 group relative hover:scale-105 ${
                      isSelected ? 'border-[#2A7B76] bg-emerald-50' : 'border-stone-200 hover:border-[#2A7B76]/50 bg-stone-50'
                    }`}
                  >
                    <img src={url} alt="Avatar" className="w-12 h-12 rounded-xl object-cover bg-white shadow-2xs" />
                    {isSelected && (
                      <span className="absolute top-1 right-1 bg-[#2A7B76] text-white p-0.5 rounded-full">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 2: VRAIE PHOTO AVEC COMPRESSION AUTOMATIQUE */}
        {activeMode === 'real' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-stone-200 rounded-3xl p-6 text-center hover:border-[#2A7B76] transition bg-stone-50/50 relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-2">
                <div className="w-12 h-12 bg-emerald-50 text-[#2A7B76] rounded-2xl flex items-center justify-center mx-auto">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-stone-800 block text-xs">
                    Cliquez ou glissez une photo ici
                  </span>
                  <span className="text-[10px] text-stone-400">
                    JPG, PNG ou WebP. Compression automatique &lt; 350 Ko garantie.
                  </span>
                </div>
              </div>
            </div>

            {isCompressing && (
              <div className="flex items-center justify-center gap-2 p-3 bg-stone-50 rounded-2xl text-stone-600 font-bold">
                <RefreshCw className="h-4 w-4 animate-spin text-[#2A7B76]" />
                <span>Optimisation et compression de l'image en cours...</span>
              </div>
            )}

            {uploadedPreview && (
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={uploadedPreview}
                    alt="Aperçu"
                    className="w-12 h-12 rounded-xl object-cover border border-stone-300"
                  />
                  <div>
                    <span className="font-bold text-stone-800 text-xs block">Photo compressée prête</span>
                    {compressionInfo && (
                      <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                        Taille : {compressionInfo.sizeKb} Ko (&lt; 350 Ko)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
                >
                  Appliquer la Photo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
