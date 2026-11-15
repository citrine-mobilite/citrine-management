import { CompanyModuleConfig, DEFAULT_MODULE_CONFIG } from '../../types';
import { safeStorage } from '../../utils/safeStorage';
import { CITRINE_DEFAULT_LOGO_BASE64 } from '../../assets/citrineLogoBase64';

export const MODULE_CACHE_KEY = 'citrine_module_config';

export function getStoredModuleConfig(): CompanyModuleConfig {
  try {
    let raw = safeStorage.getItem(MODULE_CACHE_KEY);
    if (!raw && typeof window !== 'undefined' && window.localStorage) {
      try {
        raw = window.localStorage.getItem(MODULE_CACHE_KEY);
      } catch {}
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      const configObj = parsed && typeof parsed === 'object' && 'config' in parsed ? parsed.config : parsed;
      if (configObj && typeof configObj === 'object') {
        return {
          ...DEFAULT_MODULE_CONFIG,
          ...configObj,
          companyLogoBase64: configObj.companyLogoBase64 || CITRINE_DEFAULT_LOGO_BASE64,
        };
      }
    }
  } catch (e) {
    console.warn('Erreur lecture configuration modules stockée:', e);
  }
  return DEFAULT_MODULE_CONFIG;
}

export function persistStoredModuleConfig(config: CompanyModuleConfig): void {
  try {
    const payload = JSON.stringify({
      config,
      updatedAt: new Date().toISOString(),
    });
    safeStorage.setItem(MODULE_CACHE_KEY, payload);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(MODULE_CACHE_KEY, payload);
      } catch {}
    }
  } catch {}
}
