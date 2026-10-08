import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  Image as ImageIcon, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  FileText, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../../assets/citrineLogoBase64';

interface CompanyIdentitySettingsProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyIdentitySettings: React.FC<CompanyIdentitySettingsProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState<CompanyModuleConfig>({ ...moduleConfig });
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ ...moduleConfig });
  }, [moduleConfig]);

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const updated = {
          ...formData,
          companyLogoBase64: base64Data,
        };
        setFormData(updated);
        onUpdateModuleConfig(updated);
        setIsSaved(true);
        if (showToast) showToast('Logo officiel mis à jour et conservé en base Firestore.', 'success');
      }
    };
    reader.onerror = () => {
      if (showToast) showToast('Erreur lors de la lecture du fichier image.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefaultLogo = () => {
    const updated = {
      ...formData,
      companyLogoBase64: CITRINE_DEFAULT_LOGO_BASE64,
    };
    setFormData(updated);
    onUpdateModuleConfig(updated);
    setIsSaved(true);
    if (showToast) showToast('Logo officiel Citrine restauré en base de données.', 'success');
  };

  const handleChange = (key: keyof CompanyModuleConfig, val: any) => {
    setIsSaved(false);
    setFormData((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanyModuleConfig = {
      ...formData,
      hqName: formData.companyName || formData.hqName,
    };
    onUpdateModuleConfig(updated);
    setIsSaved(true);
    if (showToast) showToast('Identité et coordonnées de l’entreprise enregistrées avec succès.', 'success');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
      {/* En-tête de domaine avec action d'enregistrement dédiée */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100/80">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Identité Juridique & Siège Social
            </h3>
            <p className="text-xs text-stone-500">
              Logo officiel conservé en base, mentions légales et coordonnées réutilisées sur les documents officiels.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          {isSaved ? <CheckCircle2 className="h-4 w-4 text-emerald-200" /> : <Save className="h-4 w-4" />}
          <span>{isSaved ? 'Identité Enregistrée' : 'Enregistrer ce Domaine'}</span>
        </button>
      </div>

      {/* 1. LOGO OFFICIEL CONSERVÉ EN BASE FIRESTORE */}
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
                L'image (PNG, JPEG, WebP) est stockée directement dans Firestore pour un affichage pérenne sur vos fiches et PDF.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            <CheckCircle2 className="h-3.5 w-3.5" /> Stockage Firestore Actif
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-1">
          {/* Aperçu du logo */}
          <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 flex items-center justify-center min-w-[200px] h-20 shadow-inner">
            <img
              src={formData.companyLogoBase64 || CITRINE_DEFAULT_LOGO_BASE64}
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
                onChange={handleLogoFileSelect}
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
                onClick={handleResetToDefaultLogo}
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

      {/* 2. INFORMATIONS LÉGALES & RAISON SOCIALE */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <FileText className="h-4 w-4 text-[#2A7B76]" />
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800">
            Renseignements Juridiques & Fiscaux
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Raison Sociale (Nom officiel) :
            </label>
            <input
              type="text"
              value={formData.companyName || formData.hqName || 'Citrine Entreprise SARL'}
              onChange={(e) => {
                handleChange('companyName', e.target.value);
                handleChange('hqName', e.target.value);
              }}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Forme Juridique :
            </label>
            <input
              type="text"
              value={formData.companyLegalForm || 'Société à Responsabilité Limitée (SARL)'}
              onChange={(e) => handleChange('companyLegalForm', e.target.value)}
              placeholder="ex: SARL, SAS, SA"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Devise / Slogan (Baseline) :
            </label>
            <input
              type="text"
              value={formData.companyBaseline || 'Innovating · Prospering | Improving · Inspiring'}
              onChange={(e) => handleChange('companyBaseline', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              N° Identifiant Unique (NIU / NIF) :
            </label>
            <input
              type="text"
              value={formData.companyNui || 'M012618579246S'}
              onChange={(e) => handleChange('companyNui', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Registre du Commerce (RCCM) :
            </label>
            <input
              type="text"
              value={formData.companyRccm || 'CM-DLA-01-2026-B13-00011'}
              onChange={(e) => handleChange('companyRccm', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl font-mono text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Capital Social :
            </label>
            <input
              type="text"
              value={formData.companyCapital || '10 000 000 FRANCS CFA'}
              onChange={(e) => handleChange('companyCapital', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* 3. COORDONNÉES DU SIÈGE ET CONTACTS */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <MapPin className="h-4 w-4 text-[#2A7B76]" />
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800">
            Adresse Physique & Contacts Officiels
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Adresse complète du Siège Social :
            </label>
            <input
              type="text"
              value={formData.hqAddress || 'JAPOMA – DOUALA'}
              onChange={(e) => handleChange('hqAddress', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1">
              Ville & Pays :
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.companyCity || 'Douala'}
                onChange={(e) => handleChange('companyCity', e.target.value)}
                placeholder="Ville"
                className="w-1/2 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
              <input
                type="text"
                value={formData.companyCountry || 'Cameroun'}
                onChange={(e) => handleChange('companyCountry', e.target.value)}
                placeholder="Pays"
                className="w-1/2 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center gap-1">
              <Phone className="h-3 w-3 text-stone-400" /> Téléphone d'accueil :
            </label>
            <input
              type="text"
              value={formData.companyPhone || '+237 680 59 40 77'}
              onChange={(e) => handleChange('companyPhone', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center gap-1">
              <Mail className="h-3 w-3 text-stone-400" /> Adresse Email officielle :
            </label>
            <input
              type="email"
              value={formData.companyEmail || 'info@citrine-mobilite.com'}
              onChange={(e) => handleChange('companyEmail', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-stone-500 mb-1 flex items-center gap-1">
              <Globe className="h-3 w-3 text-stone-400" /> Site Internet :
            </label>
            <input
              type="text"
              value={formData.companyWebsite || 'https://citrine-mobilite.com'}
              onChange={(e) => handleChange('companyWebsite', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
