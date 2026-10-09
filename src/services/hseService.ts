import { HseIncident } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument, 
  getCollection 
} from './firestoreService';

export const INITIAL_HSE_INCIDENTS: HseIncident[] = [
  {
    id: 'hse-001',
    reference: 'HSE-2026-0011',
    site: 'Base Logistique Japoma',
    zonePrecise: 'Quai de déchargement n°2',
    type: 'presque_accident',
    severity: 'modere',
    date: '2026-10-06',
    time: '09:45',
    title: 'Glissade évitée de justesse sur flaque d\'huile moteur non signalée',
    description: 'Un préparateur de commande a failli chuter en transportant un carton de pièces détachées. Une fuite d\'huile d\'un chariot élévateur stationné n\'avait pas été nettoyée ni balisée avec cône de chantier.',
    reportedBy: 'Dieudonné Etoa',
    reportedByRole: 'Magasinier Japoma',
    immediateActionTaken: 'Pose immédiate d\'absorbant sciure, balisage par ruban rouge et blanc et nettoyage complet.',
    rootCause: 'Fuite joint vérin hydraulique sur chariot n°04 non signalée lors de la check-list du matin.',
    status: 'actions_lancees',
    correctiveActions: [
      {
        id: 'act-1',
        action: 'Remplacement du joint hydraulique chariot n°04 à l\'atelier',
        assigneeName: 'Alain Fotso (Atelier)',
        deadline: '2026-10-08',
        isCompleted: true,
        completedAt: '2026-10-08T11:00:00Z'
      },
      {
        id: 'act-2',
        action: 'Rappel sécurité 5 minutes au briefing du matin sur le balisage des flaques',
        assigneeName: 'Responsable HSE Japoma',
        deadline: '2026-10-10',
        isCompleted: false
      }
    ],
    createdAt: '2026-10-06T10:15:00Z'
  },
  {
    id: 'hse-002',
    reference: 'HSE-2026-0012',
    site: 'Siège Akwa',
    zonePrecise: 'Parking souterrain / Sas véhicules',
    type: 'situation_dangereuse',
    severity: 'faible',
    date: '2026-10-07',
    time: '14:20',
    title: 'Extincteur CO2 5kg dont la goupille de sécurité est descellée',
    description: 'Lors de la ronde mensuelle de contrôle des moyens de première intervention incendie, l\'extincteur situé près du tableau électrique présentait un manomètre en zone limite et un plombage rompu.',
    reportedBy: 'Carine Mbida',
    reportedByRole: 'Assistante Administrative & Sécurité',
    immediateActionTaken: 'Remplacement temporaire par un extincteur poudre polyvalente ABC d\'appoint.',
    status: 'en_cours_analyse',
    correctiveActions: [
      {
        id: 'act-3',
        action: 'Appel du prestataire agréé pour révision et pesée des 8 extincteurs du siège',
        assigneeName: 'Services Généraux',
        deadline: '2026-10-12',
        isCompleted: false
      }
    ],
    createdAt: '2026-10-07T14:40:00Z'
  },
  {
    id: 'hse-003',
    reference: 'HSE-2026-0009',
    site: 'Atelier Mécanique Japoma',
    zonePrecise: 'Fosse de vidange n°1',
    type: 'accident_sans_arret',
    severity: 'modere',
    date: '2026-09-29',
    time: '11:10',
    title: 'Écorchure avant-bras droit lors du desserrage d\'un étrier de frein',
    description: 'Un mécanicien s\'est écorché l\'avant-bras sur une tôle coupante suite au dérapage d\'une clé à cliquet non adaptée.',
    reportedBy: 'Alain Fotso',
    reportedByRole: 'Chef d\'Atelier',
    victimName: 'Paul Kamga',
    victimInjury: 'Plaie superficielle avant-bras (aucun jour d\'arrêt, soins infirmerie immédiats)',
    immediateActionTaken: 'Désinfection, pansement compressif à la trousse de premier secours Japoma.',
    rootCause: 'Non-port des manchettes de protection renforcée en fosse.',
    status: 'cloture',
    correctiveActions: [
      {
        id: 'act-4',
        action: 'Dotation de manchettes anti-coupure et gants renforcés pour tous les mécaniciens',
        assigneeName: 'Direction Achats & HSE',
        deadline: '2026-10-02',
        isCompleted: true,
        completedAt: '2026-10-01T16:00:00Z'
      }
    ],
    createdAt: '2026-09-29T11:45:00Z'
  }
];

export function subscribeToHseIncidents(callback: (incidents: HseIncident[]) => void) {
  return subscribeToCollection<HseIncident>(COLLECTIONS.HSE_INCIDENTS, async (data) => {
    if (data.length === 0) {
      try {
        const existing = await getCollection<HseIncident>(COLLECTIONS.HSE_INCIDENTS);
        if (existing.length === 0) {
          for (const inc of INITIAL_HSE_INCIDENTS) {
            await saveDocument(COLLECTIONS.HSE_INCIDENTS, inc);
          }
          callback(INITIAL_HSE_INCIDENTS);
          return;
        }
      } catch (e) {
        console.warn('Error seeding HSE incidents:', e);
      }
    }
    callback(data.length > 0 ? data : INITIAL_HSE_INCIDENTS);
  });
}

export async function saveHseIncident(incident: HseIncident): Promise<void> {
  await saveDocument(COLLECTIONS.HSE_INCIDENTS, incident);
}

export async function deleteHseIncident(incidentId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.HSE_INCIDENTS, incidentId);
}
