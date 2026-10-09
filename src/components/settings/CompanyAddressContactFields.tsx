import React from 'react';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface CompanyAddressContactFieldsProps {
  formData: CompanyModuleConfig;
  onChange: (key: keyof CompanyModuleConfig, val: any) => void;
}

export const CompanyAddressContactFields: React.FC<CompanyAddressContactFieldsProps> = ({
  formData,
  onChange,
}) => {
  return (
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
            onChange={(e) => onChange('hqAddress', e.target.value)}
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
              onChange={(e) => onChange('companyCity', e.target.value)}
              placeholder="Ville"
              className="w-1/2 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
            />
            <input
              type="text"
              value={formData.companyCountry || 'Cameroun'}
              onChange={(e) => onChange('companyCountry', e.target.value)}
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
            onChange={(e) => onChange('companyPhone', e.target.value)}
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
            onChange={(e) => onChange('companyEmail', e.target.value)}
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
            onChange={(e) => onChange('companyWebsite', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>
    </div>
  );
};
