import { DocumentCategory, DocumentFormatType, TemplateField, RHDocTemplate } from '../types';
import { 
  DEFAULT_RH_TEMPLATES, 
  renderRHTemplateText,
  subscribeToRHDocumentTemplates,
  saveRHDocumentTemplate,
  deleteRHDocumentTemplate,
  resetRHDocumentTemplatesToDefaults
} from '../services/rhDocumentTemplateService';

export type { TemplateField, RHDocTemplate };

export interface DocTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  formatType: DocumentFormatType;
  description: string;
  isGeneric: boolean;
  defaultStorageInDb: boolean; // TOUJOURS true : conformité stricte « gardes les données sur les documents rh en bd »
  defaultSignature: boolean; // Toujours false : signature opt-in
  fields: TemplateField[];
  bodyTemplate?: string;
  renderText: (params: Record<string, any>) => string;
  isCustom?: boolean;
}

/**
 * Convertit un modèle stocké en base de données Firestore en format DocTemplate
 */
export function convertRHTemplateToDocTemplate(rhTpl: RHDocTemplate): DocTemplate {
  return {
    id: rhTpl.id,
    name: rhTpl.name,
    category: rhTpl.category,
    formatType: rhTpl.formatType,
    description: rhTpl.description,
    isGeneric: rhTpl.category === 'memo' || rhTpl.category === 'regulation' || rhTpl.category === 'job_description' || rhTpl.category === 'evaluation',
    defaultStorageInDb: true, // Toujours conservé en BD Firestore
    defaultSignature: false,
    fields: rhTpl.fields || [],
    bodyTemplate: rhTpl.bodyTemplate,
    renderText: (params: Record<string, any>) => renderRHTemplateText(rhTpl, params),
    isCustom: rhTpl.isCustom
  };
}

/**
 * Modèles initiaux enregistrés et synchronisés avec Firestore
 */
export const DOC_TEMPLATES: DocTemplate[] = DEFAULT_RH_TEMPLATES.map(convertRHTemplateToDocTemplate);

export {
  subscribeToRHDocumentTemplates,
  saveRHDocumentTemplate,
  deleteRHDocumentTemplate,
  resetRHDocumentTemplatesToDefaults
};
