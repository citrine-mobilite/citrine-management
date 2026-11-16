import React, { useState, useEffect } from 'react';
import {
  Layers,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { MODULES_LIST } from './companyModulesCatalog';
import { executeOperationWithLoading } from '../../utils/sweetAlert';

interface CompanyModulesToggleProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => Promise<void> | void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyModulesToggle: React.FC<CompanyModulesToggleProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
}) => {
  const [formData, setFormData] = useState<CompanyModuleConfig>({ ...moduleConfig });

  useEffect(() => {
    setFormData({ ...moduleConfig });
  }, [moduleConfig]);

  const handleToggle = async (key: keyof CompanyModuleConfig, title: string) => {
    const currentState = formData[key] !== false;
    const newState = !currentState;
    const updated = {
      ...formData,
      [key]: newState,
    };
    const res = await executeOperationWithLoading({
      loadingTitle: newState ? 'Activation du module...' : 'Désactivation du module...',
      loadingText: `Veuillez patienter pendant la mise à jour du module "${title}"...`,
      action: async () => {
        await onUpdateModuleConfig(updated);
      },
      successTitle: newState ? 'Module activé !' : 'Module désactivé !',
      successMessage: `Module "${title}" ${newState ? 'activé' : 'désactivé'} avec succès.`,
    });
    if (res.success) {
      setFormData(updated);
    }
  };

  const activeCount = MODULES_LIST.filter((m) => formData[m.key] !== false).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Activation & Désactivation des Modules
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl font-mono">
            {activeCount} / {MODULES_LIST.length} modules actifs
          </span>
          <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sauvegardé en BD</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULES_LIST.map((module) => {
          const isEnabled = formData[module.key] !== false;
          const Icon = module.icon;

          return (
            <div
              key={module.key}
              onClick={() => handleToggle(module.key, module.title)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                isEnabled
                  ? 'bg-white border-[#2A7B76]/30 shadow-2xs hover:border-[#2A7B76]/60'
                  : 'bg-stone-50/70 border-stone-200 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`p-3 rounded-2xl shrink-0 transition-colors ${
                    isEnabled ? 'bg-emerald-50 text-[#2A7B76] border border-emerald-100' : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-xs text-stone-900 truncate">
                      {module.title}
                    </h4>
                    {isEnabled ? (
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full shrink-0">
                        Actif
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-stone-200 text-stone-600 px-2 py-0.2 rounded-full shrink-0">
                        Inactif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-2">
                    {module.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-[#2A7B76]">
                {isEnabled ? (
                  <ToggleRight className="h-8 w-8 text-[#2A7B76]" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-stone-400" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-stone-50/80 border border-stone-200 rounded-3xl p-4 flex items-start gap-3 text-xs text-stone-600">
        <ShieldCheck className="h-5 w-5 text-[#2A7B76] shrink-0 mt-0.5" />
        <div>
          <strong className="text-stone-900">Socle d'Administration Permanent :</strong>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Conformément aux règles de sécurité, les sections <strong>« Utilisateurs & Rôles »</strong> et <strong>« Configuration Entreprise »</strong> restent toujours actives afin de garantir la continuité de gestion administrative par les super-administrateurs.
          </p>
        </div>
      </div>
    </div>
  );
};
