import { JobOffer, JobApplication } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument, 
  getCollection 
} from './firestoreService';

export const INITIAL_JOB_OFFERS: JobOffer[] = [
  {
    id: 'job-001',
    title: 'Superviseur Logistique & Dispatch Flotte',
    department: 'Logistique & Exploitation',
    location: 'Base Logistique Japoma - Douala',
    contractType: 'CDI',
    openingsCount: 2,
    description: 'Supervision des départs/retours des véhicules, contrôle des plannings de tournée et coordination avec les plateformes partenaires (Yango, Gozem).',
    requirements: [
      'Bac+3 minimum en Transport & Logistique ou Gestion',
      'Minimum 3 ans d\'expérience dans la gestion d\'une flotte automobile ou messagerie express',
      'Maîtrise d\'Excel et des outils de géolocalisation GPS',
      'Permis B obligatoire'
    ],
    salaryRange: '250 000 - 350 000 XAF / mois',
    deadline: '2026-11-30',
    status: 'ouvert',
    createdAt: '2026-10-01T09:00:00Z',
    createdBy: 'Direction RH Citrine'
  },
  {
    id: 'job-002',
    title: 'Chauffeur VTC / Livreur Professionnel',
    department: 'Opérations Terrain',
    location: 'Douala (Akwa / Bonanjo / Japoma)',
    contractType: 'CDD',
    openingsCount: 5,
    description: 'Transport de passagers et livraisons colis pour le compte des entreprises partenaires avec les véhicules de la flotte Citrine.',
    requirements: [
      'Permis de conduire catégorie B valide depuis au moins 3 ans',
      'Excellente connaissance du plan de circulation de la ville de Douala',
      'Smartphone Android récent compatible avec nos applications de navigation',
      'Sens poussé du service client et ponctualité exemplaire'
    ],
    salaryRange: '130 000 - 180 000 XAF + Primes assiduité',
    deadline: '2026-11-15',
    status: 'en_cours',
    createdAt: '2026-10-03T11:30:00Z',
    createdBy: 'Direction RH Citrine'
  },
  {
    id: 'job-003',
    title: 'Mécanicien Automobile Flotte Poids Léger & VTC',
    department: 'Maintenance & Atelier',
    location: 'Atelier Central Japoma',
    contractType: 'CDI',
    openingsCount: 1,
    description: 'Maintenance préventive et corrective de la flotte de véhicules légers, diagnostics électroniques et suivi des vidanges.',
    requirements: [
      'CAP / BT / BTS en Mécanique Automobile',
      'Expérience confirmée sur moteurs essence et diesel récents',
      'Capacité d\'intervention rapide en cas de panne sur la route'
    ],
    salaryRange: '180 000 - 240 000 XAF / mois',
    deadline: '2026-12-05',
    status: 'ouvert',
    createdAt: '2026-10-05T14:15:00Z',
    createdBy: 'Direction Technique Citrine'
  }
];

export const INITIAL_JOB_APPLICATIONS: JobApplication[] = [
  {
    id: 'app-001',
    jobOfferId: 'job-001',
    jobOfferTitle: 'Superviseur Logistique & Dispatch Flotte',
    candidateName: 'Michel Tchakounte',
    candidateEmail: 'm.tchakounte@gmail.com',
    candidatePhone: '+237 671 23 45 89',
    candidateCity: 'Douala (Ndogbong)',
    currentPosition: 'Chef d\'équipe magasin chez Transit Express',
    experienceYears: 4,
    educationLevel: 'Licence Pro Logistique Portuaire',
    stage: 'entretien_technique',
    rating: 4,
    notes: 'Très bonne maîtrise de l\'optimisation des tournées. Recommandé par l\'ancien responsable d\'exploitation.',
    interviewDate: '2026-10-14T10:00',
    interviewFeedback: 'Test technique sur simulation de tournées réussi à 88%. Convaincant sur la gestion des conflits chauffeurs.',
    tags: ['Logistique', 'Excel', 'Leadership', 'Permis B'],
    appliedAt: '2026-10-04T10:20:00Z',
    updatedAt: '2026-10-08T16:00:00Z'
  },
  {
    id: 'app-002',
    jobOfferId: 'job-002',
    jobOfferTitle: 'Chauffeur VTC / Livreur Professionnel',
    candidateName: 'Serge Ndjock',
    candidateEmail: 'serge.ndjock92@yahoo.fr',
    candidatePhone: '+237 694 55 12 03',
    candidateCity: 'Douala (Logbessou)',
    currentPosition: 'Chauffeur indépendant VTC',
    experienceYears: 5,
    educationLevel: 'Baccalauréat A4',
    stage: 'offre_proposee',
    rating: 5,
    notes: 'Excellente tenue, ponctuel, casier judiciaire vierge présenté, maîtrise parfaite de Bonapriso et Akwa.',
    interviewDate: '2026-10-07T14:30',
    interviewFeedback: 'Entretien RH concluant. Proposition de contrat CDD 6 mois avec période d\'essai envoyée.',
    tags: ['VTC', 'Conduite défensive', 'Relation client'],
    appliedAt: '2026-10-05T08:45:00Z',
    updatedAt: '2026-10-08T11:00:00Z'
  },
  {
    id: 'app-003',
    jobOfferId: 'job-002',
    jobOfferTitle: 'Chauffeur VTC / Livreur Professionnel',
    candidateName: 'Brice Kamdem',
    candidateEmail: 'kamdem.brice.trans@outlook.com',
    candidatePhone: '+237 655 88 99 22',
    candidateCity: 'Douala (Bonamoussadi)',
    currentPosition: 'Livreur messagerie',
    experienceYears: 2,
    stage: 'entretien_rh',
    rating: 3,
    notes: 'Entretien prévu avec la responsable RH ce vendredi.',
    interviewDate: '2026-10-12T15:00',
    tags: ['Messagerie', 'Deux-roues', 'Permis B'],
    appliedAt: '2026-10-06T12:00:00Z'
  },
  {
    id: 'app-004',
    jobOfferId: 'job-003',
    jobOfferTitle: 'Mécanicien Automobile Flotte Poids Léger & VTC',
    candidateName: 'Alain Fotso',
    candidateEmail: 'fotso.alain.auto@gmail.com',
    candidatePhone: '+237 670 11 22 33',
    candidateCity: 'Douala (Bassa)',
    currentPosition: 'Électricien-Mécanicien chez Garage Moderne',
    experienceYears: 6,
    educationLevel: 'BTS Maintenance des Véhicules',
    stage: 'en_revue',
    rating: 4,
    notes: 'Dossier complet, forte compétence en diagnostic valise OBD.',
    tags: ['Valise OBD', 'Moteur Diesel', 'Électricité auto'],
    appliedAt: '2026-10-08T09:10:00Z'
  }
];

export function subscribeToJobOffers(callback: (offers: JobOffer[]) => void) {
  return subscribeToCollection<JobOffer>(COLLECTIONS.JOB_OFFERS, async (data) => {
    if (data.length === 0) {
      try {
        const existing = await getCollection<JobOffer>(COLLECTIONS.JOB_OFFERS);
        if (existing.length === 0) {
          for (const offer of INITIAL_JOB_OFFERS) {
            await saveDocument(COLLECTIONS.JOB_OFFERS, offer);
          }
          callback(INITIAL_JOB_OFFERS);
          return;
        }
      } catch (e) {
        console.warn('Error seeding job offers:', e);
      }
    }
    callback(data.length > 0 ? data : INITIAL_JOB_OFFERS);
  });
}

export function subscribeToJobApplications(callback: (apps: JobApplication[]) => void) {
  return subscribeToCollection<JobApplication>(COLLECTIONS.JOB_APPLICATIONS, async (data) => {
    if (data.length === 0) {
      try {
        const existing = await getCollection<JobApplication>(COLLECTIONS.JOB_APPLICATIONS);
        if (existing.length === 0) {
          for (const app of INITIAL_JOB_APPLICATIONS) {
            await saveDocument(COLLECTIONS.JOB_APPLICATIONS, app);
          }
          callback(INITIAL_JOB_APPLICATIONS);
          return;
        }
      } catch (e) {
        console.warn('Error seeding job applications:', e);
      }
    }
    callback(data.length > 0 ? data : INITIAL_JOB_APPLICATIONS);
  });
}

export async function saveJobOffer(offer: JobOffer): Promise<void> {
  await saveDocument(COLLECTIONS.JOB_OFFERS, offer);
}

export async function deleteJobOffer(offerId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.JOB_OFFERS, offerId);
}

export async function saveJobApplication(app: JobApplication): Promise<void> {
  await saveDocument(COLLECTIONS.JOB_APPLICATIONS, app);
}

export async function deleteJobApplication(appId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.JOB_APPLICATIONS, appId);
}
