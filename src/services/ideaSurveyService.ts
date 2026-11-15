import { IdeaSuggestion, EnterpriseSurvey } from '../types';
import {
  COLLECTIONS,
  subscribeToCollection,
  saveDocument,
  deleteDocument,
} from './dataService';

export function subscribeToIdeas(callback: (ideas: IdeaSuggestion[]) => void) {
  return subscribeToCollection<IdeaSuggestion>(COLLECTIONS.IDEA_SUGGESTIONS, (data) => {
    callback(Array.isArray(data) ? data : []);
  });
}

export function subscribeToSurveys(callback: (surveys: EnterpriseSurvey[]) => void) {
  return subscribeToCollection<EnterpriseSurvey>(COLLECTIONS.ENTERPRISE_SURVEYS, (data) => {
    callback(Array.isArray(data) ? data : []);
  });
}

export async function saveIdea(idea: IdeaSuggestion): Promise<void> {
  await saveDocument(COLLECTIONS.IDEA_SUGGESTIONS, idea);
}

export async function deleteIdea(ideaId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.IDEA_SUGGESTIONS, ideaId);
}

export async function saveSurvey(survey: EnterpriseSurvey): Promise<void> {
  await saveDocument(COLLECTIONS.ENTERPRISE_SURVEYS, survey);
}

export async function deleteSurvey(surveyId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.ENTERPRISE_SURVEYS, surveyId);
}
