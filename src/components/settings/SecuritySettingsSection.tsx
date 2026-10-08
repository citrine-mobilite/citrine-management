import React, { useState } from 'react';
import { Shield, Key, Wifi, Globe, Save, RefreshCw } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface SecuritySettingsSectionProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const SecuritySettingsSection: React.FC<SecuritySettingsSectionProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState({
    qrCodeSecret: moduleConfig.qrCodeSecret || 'CITRINE_SECRET_2026',
    officeWifiSsid: moduleConfig.officeWifiSsid || 'Citrine_Enterprise_5G',
    allowedOfficeIPs: (moduleConfig.allowedOfficeIPs || ['192.168.1.1', '10.0.0.1']).join(', '),
  });

  const handleGenerateSecret = () => {
    const newSecret = 'CIT_' + Math.random().toString(36).substring(2, 10).toUpperCase() + '_' + Date.now().toString(36).toUpperCase();
    setFormData((prev) => ({ ...prev, qrCodeSecret: newSecret }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanyModuleConfig = {
      ...moduleConfig,
      qrCodeSecret: formData.qrCodeSecret.trim(),
      officeWifiSsid: formData.officeWifiSsid.trim(),
      allowedOfficeIPs: formData.allowedOfficeIPs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    onUpdateModuleConfig(updated);
    if (showToast) showToast('Paramètres de sécurité et bornes QR enregistrés avec succès.', 'success');
  };

  return (
    <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
        <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-2xl">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-base text-stone-900">
            Sécurité & Bornes de Pointage
          </h3>
          <p className="text-xs text-stone-500">
            Clés de chiffrement des QR codes de porte, réseaux Wi-Fi de confiance et filtrage d'adresses IP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* QR Code Secret */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-stone-600 flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-[#2A7B76]" /> Clé secrète de signature QR Code :
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={formData.qrCodeSecret}
              onChange={(e) => setFormData({ ...formData, qrCodeSecret: e.target.value })}
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
            <button
              type="button"
              onClick={handleGenerateSecret}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1"
              title="Générer une nouvelle clé"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Générer</span>
            </button>
          </div>
          <p className="text-[10px] text-stone-400">
            Cette clé valide l'authenticité des QR codes de porte imprimés et scannés.
          </p>
        </div>

        {/* Wi-Fi SSID */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-stone-600 flex items-center gap-1.5">
            <Wifi className="h-3.5 w-3.5 text-amber-600" /> SSID Wi-Fi du Bureau (Optionnel) :
          </label>
          <input
            type="text"
            value={formData.officeWifiSsid}
            onChange={(e) => setFormData({ ...formData, officeWifiSsid: e.target.value })}
            placeholder="Ex: Citrine_Corp_Secure"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-medium text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[10px] text-stone-400">
            Nom du réseau sans fil de l'entreprise pour validation de présence.
          </p>
        </div>

        {/* Allowed IPs */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-stone-600 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-indigo-600" /> Adresses IP ou sous-réseaux autorisés (Séparés par des virgules) :
          </label>
          <input
            type="text"
            value={formData.allowedOfficeIPs}
            onChange={(e) => setFormData({ ...formData, allowedOfficeIPs: e.target.value })}
            placeholder="192.168.1.1, 10.0.0.1, 41.202.219.12"
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[10px] text-stone-400">
            Laissez vide pour autoriser le pointage depuis toutes les adresses IP validées par GPS.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-stone-100">
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          <span>Enregistrer les paramètres de sécurité</span>
        </button>
      </div>
    </form>
  );
};
