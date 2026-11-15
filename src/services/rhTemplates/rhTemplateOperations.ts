import { RHDocTemplate } from '../../types';
import {
  COLLECTIONS,
  subscribeToCollection,
  saveDocument,
  deleteDocument,
} from '../dataService';

export function renderRHTemplateTextWithDefaults(
  template: RHDocTemplate,
  params: Record<string, any>
): string {
  let text = template.bodyTemplate || '';

  Object.keys(params).forEach((key) => {
    const val = params[key];
    const formattedVal =
      typeof val === 'number'
        ? val.toLocaleString('fr-FR')
        : val !== undefined && val !== null
        ? String(val)
        : '';
    text = text.split(`{{${key}}}`).join(formattedVal);
  });

  template.fields.forEach((f) => {
    if (text.includes(`{{${f.key}}}`)) {
      text = text.split(`{{${f.key}}}`).join(f.defaultValue || '');
    }
  });

  return text;
}

export function subscribeToRHDocumentTemplatesWithDefaults(
  defaultTemplates: RHDocTemplate[],
  onUpdate: (templates: RHDocTemplate[]) => void
): () => void {
  let isInitialized = false;

  const unsubscribe = subscribeToCollection<RHDocTemplate>(
    COLLECTIONS.RH_DOCUMENT_TEMPLATES,
    async (dbTemplates) => {
      if (!isInitialized && dbTemplates.length === 0) {
        isInitialized = true;
        try {
          for (const tpl of defaultTemplates) {
            await saveDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, {
              ...tpl,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn('Initialisation des modèles RH en BD différée:', err);
        }
        onUpdate(defaultTemplates);
        return;
      }

      isInitialized = true;
      if (dbTemplates.length > 0) {
        onUpdate(dbTemplates);
      } else {
        onUpdate(defaultTemplates);
      }
    }
  );

  return unsubscribe;
}

export async function saveRHDocumentTemplateDoc(template: RHDocTemplate): Promise<void> {
  const dataToSave: RHDocTemplate = {
    ...template,
    updatedAt: new Date().toISOString(),
  };
  await saveDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, dataToSave);
}

export async function deleteRHDocumentTemplateDoc(templateId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, templateId);
}

export async function resetRHDocumentTemplatesList(
  defaultTemplates: RHDocTemplate[]
): Promise<void> {
  for (const tpl of defaultTemplates) {
    await saveDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, {
      ...tpl,
      updatedAt: new Date().toISOString(),
    });
  }
}
