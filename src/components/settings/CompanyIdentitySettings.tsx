import React, { useState, useEffect } from 'react';
import { Building2, Save, CheckCircle2 } from 'lucide-react';
import { CompanyModuleConfig, DEFAULT_MODULE_CONFIG } from '../../types';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../../assets/citrineLogoBase64';
import { CompanyLogoCard } from './CompanyLogoCard';
import { CompanyLegalInfoFields } from './CompanyLegalInfoFields';
import { CompanyAddressContactFields } from './CompanyAddressContactFields';

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
  const safeConfig: CompanyModuleConfig = {
    ...DEFAULT_MODULE_CONFIG,
    ...(moduleConfig || {}),
  };

  const [formData, setFormData] = useState<CompanyModuleConfig>(safeConfig);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData({
      ...DEFAULT_MODULE_CONFIG,
      ...(moduleConfig || {}),
    });
  }, [moduleConfig]);

  const handleChange = (key: keyof CompanyModuleConfig, val: any) => {
    setIsSaved(false);
    setFormData((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSelectLogo = (base64: string) => {
    const updated = {
      ...formData,
      companyLogoBase64: base64,
    };
    setFormData(updated);
    onUpdateModuleConfig(updated);
    setIsSaved(true);
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
      <CompanyLogoCard
        companyLogoBase64={formData.companyLogoBase64}
        onSelectLogo={handleSelectLogo}
        onResetDefault={handleResetToDefaultLogo}
        showToast={showToast}
      />

      {/* 2. INFORMATIONS LÉGALES & RAISON SOCIALE */}
      <CompanyLegalInfoFields formData={formData} onChange={handleChange} />

      {/* 3. COORDONNÉES DU SIÈGE ET CONTACTS */}
      <CompanyAddressContactFields formData={formData} onChange={handleChange} />
    </form>
  );
};
