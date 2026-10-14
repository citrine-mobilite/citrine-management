import React from 'react';
import { FileText } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';

interface CompanyLegalInfoFieldsProps {
  formData: CompanyModuleConfig;
  onChange: (key: keyof CompanyModuleConfig, val: any) => void;
}

export const CompanyLegalInfoFields: React.FC<CompanyLegalInfoFieldsProps> = ({
  formData,
  onChange,
}) => {
  return (
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
              onChange('companyName', e.target.value);
              onChange('hqName', e.target.value);
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
            onChange={(e) => onChange('companyLegalForm', e.target.value)}
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
            onChange={(e) => onChange('companyBaseline', e.target.value)}
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
            onChange={(e) => onChange('companyNui', e.target.value)}
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
            onChange={(e) => onChange('companyRccm', e.target.value)}
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
            onChange={(e) => onChange('companyCapital', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-[#2A7B76] focus:bg-white transition"
          />
        </div>
      </div>
    </div>
  );
};
