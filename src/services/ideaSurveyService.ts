import { IdeaSuggestion, EnterpriseSurvey } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument, 
  getCollection 
} from './firestoreService';

export const INITIAL_IDEAS: IdeaSuggestion[] = [
  {
    id: 'idea-001',
    title: 'Installation d\'une fontaine à eau réfrigérée et abri repos à la Base Japoma',
    description: 'Les chauffeurs et magasiniers attendent souvent sous la chaleur entre deux chargements. Une fontaine d\'eau fraîche et un banc d\'ombre amélioreraient grandement le confort et la productivité.',
    category: 'bien_etre_securite',
    isAnonymous: false,
    authorName: 'Jean-Marc Bassong',
    authorDepartment: 'Logistique',
    status: 'retenue_test',
    likesCount: 14,
    likedUserIds: ['user-1', 'user-2', 'user-3'],
    managementResponse: 'Projet validé par la Direction. Devis retenu, installation planifiée d\'ici fin octobre sous le préau Japoma.',
    createdAt: '2026-10-02T10:00:00Z'
  },
  {
    id: 'idea-002',
    title: 'Intégration d\'une check-list smartphone quotidienne avant prise de véhicule',
    description: 'Permettre aux chauffeurs de cocher rapidement niveau d\'huile, état des pneus, et niveau de carburant sur l\'app Citrine avant de démarrer, pour responsabiliser et réduire les pannes évitables.',
    category: 'innovation_logistique',
    isAnonymous: false,
    authorName: 'Alain Fotso',
    authorDepartment: 'Atelier Mécanique',
    status: 'a_letude',
    likesCount: 9,
    likedUserIds: ['user-2', 'user-4'],
    managementResponse: 'Excellente suggestion technique. En cours de cadrage avec l\'équipe informatique.',
    createdAt: '2026-10-05T14:30:00Z'
  },
  {
    id: 'idea-003',
    title: 'Partenariat cantine / paniers repas subventionnés pour l\'équipe du soir',
    description: 'Les agents de nuit et chauffeurs en fin de service après 19h ont du mal à trouver des repas équilibrés à des prix raisonnables aux abords de Japoma.',
    category: 'vie_au_bureau',
    isAnonymous: true,
    status: 'soumise',
    likesCount: 7,
    likedUserIds: ['user-3'],
    createdAt: '2026-10-07T18:00:00Z'
  }
];

export const INITIAL_SURVEYS: EnterpriseSurvey[] = [
  {
    id: 'surv-001',
    title: 'Horaires aménagés lors de la saison des grandes pluies à Douala',
    description: 'Afin d\'anticiper les embouteillages monstres lors des fortes pluies à Akwa et Japoma, quelle formule d\'horaire préférez-vous pour les équipes de bureau ?',
    category: 'Organisation du travail',
    status: 'actif',
    deadline: '2026-10-25',
    createdBy: 'Direction des Ressources Humaines',
    options: [
      { id: 'opt-1', text: 'Avancer d\'une demi-heure : 07h30 - 16h00', votesCount: 12 },
      { id: 'opt-2', text: 'Maintenir les horaires habituels : 08h00 - 16h30', votesCount: 6 },
      { id: 'opt-3', text: 'Télétravail partiel 1 jour / semaine (services éligibles)', votesCount: 19 }
    ],
    votedUserIds: ['user-1', 'user-2'],
    createdAt: '2026-10-04T08:00:00Z'
  },
  {
    id: 'surv-002',
    title: 'Choix de l\'activité pour la Journée Citrine de Cohésion d\'Équipe 2026',
    description: 'Votez pour la formule de teambuilding annuel qui aura lieu en novembre pour l\'ensemble du personnel.',
    category: 'Vie d\'entreprise & QVT',
    status: 'actif',
    deadline: '2026-10-31',
    createdBy: 'Comité de Direction',
    options: [
      { id: 'opt-a', text: 'Tournoi sportif inter-départements & barbecue à Kribi', votesCount: 22 },
      { id: 'opt-b', text: 'Séminaire détente & formation au Mont Fébé (Yaoundé)', votesCount: 8 },
      { id: 'opt-c', text: 'Journée festive avec familles au Club Equestre Douala', votesCount: 15 }
    ],
    votedUserIds: ['user-1'],
    createdAt: '2026-10-06T11:00:00Z'
  }
];

export function subscribeToIdeas(callback: (ideas: IdeaSuggestion[]) => void) {
  return subscribeToCollection<IdeaSuggestion>(COLLECTIONS.IDEA_SUGGESTIONS, async (data) => {
    if (data.length === 0) {
      try {
        const existing = await getCollection<IdeaSuggestion>(COLLECTIONS.IDEA_SUGGESTIONS);
        if (existing.length === 0) {
          for (const item of INITIAL_IDEAS) {
            await saveDocument(COLLECTIONS.IDEA_SUGGESTIONS, item);
          }
          callback(INITIAL_IDEAS);
          return;
        }
      } catch (e) {
        console.warn('Error seeding ideas:', e);
      }
    }
    callback(data.length > 0 ? data : INITIAL_IDEAS);
  });
}

export function subscribeToSurveys(callback: (surveys: EnterpriseSurvey[]) => void) {
  return subscribeToCollection<EnterpriseSurvey>(COLLECTIONS.ENTERPRISE_SURVEYS, async (data) => {
    if (data.length === 0) {
      try {
        const existing = await getCollection<EnterpriseSurvey>(COLLECTIONS.ENTERPRISE_SURVEYS);
        if (existing.length === 0) {
          for (const item of INITIAL_SURVEYS) {
            await saveDocument(COLLECTIONS.ENTERPRISE_SURVEYS, item);
          }
          callback(INITIAL_SURVEYS);
          return;
        }
      } catch (e) {
        console.warn('Error seeding surveys:', e);
      }
    }
    callback(data.length > 0 ? data : INITIAL_SURVEYS);
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
