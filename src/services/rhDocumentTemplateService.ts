import { RHDocTemplate } from '../types';
import { RH_TEMPLATES_ADMINISTRATIVE } from './rhTemplates/rhTemplatesAdministrative';
import { RH_TEMPLATES_OPERATIONS } from './rhTemplates/rhTemplatesOperations';
import { RH_TEMPLATES_CORPORATE } from './rhTemplates/rhTemplatesCorporate';
import {
  renderRHTemplateTextWithDefaults,
  subscribeToRHDocumentTemplatesWithDefaults,
  saveRHDocumentTemplateDoc,
  deleteRHDocumentTemplateDoc,
  resetRHDocumentTemplatesList,
} from './rhTemplates/rhTemplateOperations';

export const DEFAULT_RH_TEMPLATES: RHDocTemplate[] = [
  ...RH_TEMPLATES_ADMINISTRATIVE,
  ...RH_TEMPLATES_OPERATIONS,
  ...RH_TEMPLATES_CORPORATE,
];

export function renderRHTemplateText(template: RHDocTemplate, params: Record<string, any>): string {
  return renderRHTemplateTextWithDefaults(template, params);
}

export function subscribeToRHDocumentTemplates(
  onUpdate: (templates: RHDocTemplate[]) => void
): () => void {
  return subscribeToRHDocumentTemplatesWithDefaults(DEFAULT_RH_TEMPLATES, onUpdate);
}

export async function saveRHDocumentTemplate(template: RHDocTemplate): Promise<void> {
  return saveRHDocumentTemplateDoc(template);
}

export async function deleteRHDocumentTemplate(templateId: string): Promise<void> {
  return deleteRHDocumentTemplateDoc(templateId);
}

export async function resetRHDocumentTemplatesToDefaults(): Promise<void> {
  return resetRHDocumentTemplatesList(DEFAULT_RH_TEMPLATES);
}
