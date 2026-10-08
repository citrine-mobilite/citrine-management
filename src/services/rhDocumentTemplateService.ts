import { RHDocTemplate } from '../types';
import { 
  COLLECTIONS, 
  subscribeToCollection, 
  saveDocument, 
  deleteDocument 
} from './firestoreService';

/**
 * Modèles officiels initiaux de documents RH (conservés et synchronisés en base de données Firestore)
 */
export const DEFAULT_RH_TEMPLATES: RHDocTemplate[] = [
  {
    id: 'tpl-memo',
    name: "Note de Service / Directive Interne",
    category: 'memo',
    formatType: 'word',
    description: "Diffusion collective d'instructions, organisation interne et consignes générales.",
    defaultSignature: false,
    fields: [
      { key: 'subject', label: 'Objet de la Note', type: 'text', defaultValue: 'Mise à jour des horaires et respect du pointage de présence' },
      { key: 'targetAudience', label: 'Destinataires', type: 'text', defaultValue: 'Ensemble du personnel et chefs de départements' },
      { key: 'urgency', label: "Niveau d'urgence", type: 'select', defaultValue: 'Important', options: ['Normal', 'Important', 'Urgent / Immédiat'] },
      { key: 'effectiveDate', label: "Date d'effet", type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'mainDirective', label: 'Contenu des consignes', type: 'textarea', defaultValue: "À compter de la date mentionnée, l'ensemble des collaborateurs est tenu d'émarger à l'arrivée (08h00) et au départ (17h00). Tout retard ou empêchement doit être notifié au service RH avant 08h30." }
    ],
    bodyTemplate: `NOTE DE SERVICE INTERNE

DESTINATAIRES : {{targetAudience}}
DATE D'APPLICATION : {{effectiveDate}}
NIVEAU D'URGENCE : {{urgency}}

OBJET : {{subject}}

1. DISPOSITIONS GÉNÉRALES
La présente note de service a pour objet de rappeler et d'actualiser les règles organisationnelles applicables au sein de notre établissement.

2. CONSIGNES & DIRECTIVES
{{mainDirective}}

3. ENTRÉE EN VIGUEUR
Les présentes dispositions entrent en vigueur dès leur diffusion et s'imposent à l'ensemble des collaborateurs concernés.

La Direction générale compte sur l'implication et le sens des responsabilités de chacun pour leur stricte application.`
  },
  {
    id: 'tpl-contract',
    name: "Contrat de Travail (CDI / CDD)",
    category: 'contract',
    formatType: 'word',
    description: "Contrat individuel d'embauche fixant les fonctions, la rémunération et les engagements réciproques.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom & Prénom du Salarié', type: 'text', defaultValue: 'Jean-Marc DUPONT' },
      { key: 'contractType', label: 'Nature du Contrat', type: 'select', defaultValue: 'CDI (Durée Indéterminée)', options: ['CDI (Durée Indéterminée)', 'CDD (Durée Déterminée - 6 mois)', 'CDD (Durée Déterminée - 12 mois)', 'Contrat de Projet'] },
      { key: 'positionTitle', label: 'Fonction / Poste occupé', type: 'text', defaultValue: "Ingénieur d'Affaires / Chef de Projet" },
      { key: 'monthlySalary', label: 'Salaire brut mensuel (FCFA)', type: 'number', defaultValue: '450000' },
      { key: 'startDate', label: 'Date de prise de fonction', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'trialPeriodMonths', label: "Période d'essai (mois)", type: 'number', defaultValue: '3' },
      { key: 'workplace', label: "Lieu d'affectation", type: 'text', defaultValue: 'Douala (avec déplacements sur chantiers)' }
    ],
    bodyTemplate: `CONTRAT DE TRAVAIL : {{contractType}}

ENTRE LES SOUSSIGNÉS :
CITRINE SARL, société à responsabilité limitée, immatriculée au RCCM de Douala sous le N° CM-DLA-01-2026-B13-00011, représentée par sa Direction Générale,
Ci-après désignée "L'Employeur",

D'une part,

ET :
M./Mme {{employeeName}},
Ci-après désigné(e) "Le Salarié",

D'autre part,

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 - ENGAGEMENT ET FONCTION
L'Employeur engage le Salarié en qualité de {{positionTitle}}, sous le régime d'un {{contractType}}, à compter du {{startDate}}.

ARTICLE 2 - PÉRIODE D'ESSAI
Le présent contrat est soumis à une période d'essai de {{trialPeriodMonths}} mois, renouvelable une fois conformément aux dispositions du Code du Travail.

ARTICLE 3 - LIEU D'EXÉCUTION
Le Salarié exercera ses fonctions principalement à : {{workplace}}. Il pourra être amené à effectuer des missions sur l'ensemble des sites de l'entreprise.

ARTICLE 4 - RÉMUNÉRATION
En contrepartie de l'accomplissement de ses fonctions, le Salarié percevra une rémunération brute mensuelle de {{monthlySalary}} FRANCS CFA, soumise aux cotisations sociales légales.

ARTICLE 5 - CONFIDENTIALITÉ ET LOYAUTÉ
Le Salarié s'engage à observer une discrétion absolue sur toutes les informations stratégiques et professionnelles dont il aura connaissance.`
  },
  {
    id: 'tpl-attestation',
    name: "Attestation d'Emploi & Présence",
    category: 'attestation',
    formatType: 'word',
    description: "Attestation certifiant que le collaborateur fait actuellement partie du personnel actif.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Paul KOUASSI' },
      { key: 'positionTitle', label: 'Poste Occupé', type: 'text', defaultValue: 'Responsable Logistique & Approvisionnements' },
      { key: 'hireDate', label: "Date d'embauche initiale", type: 'date', defaultValue: '2024-02-01' },
      { key: 'department', label: 'Département', type: 'text', defaultValue: 'Exploitation & Flotte' },
      { key: 'purpose', label: 'Motif de délivrance', type: 'text', defaultValue: 'Faire valoir ce que de droit auprès des organismes compétents' }
    ],
    bodyTemplate: `ATTESTATION D'EMPLOI ET DE PRÉSENCE

Nous soussignés, Direction des Ressources Humaines de CITRINE SARL, attestons par la présente que :

M./Mme {{employeeName}} est employé(e) au sein de notre établissement depuis le {{hireDate}}, en qualité de {{positionTitle}}, au sein du département {{department}}.

L'intéressé(e) est à ce jour en activité régulière et n'a fait l'objet d'aucune mesure de rupture ou de préavis.

La présente attestation lui est délivrée sur sa demande pour : {{purpose}}.`
  },
  {
    id: 'tpl-certificate',
    name: "Certificat de Travail (Fin de Contrat)",
    category: 'certificate',
    formatType: 'word',
    description: "Document légal remis au collaborateur à la fin de son contrat de travail.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Collaborateur', type: 'text', defaultValue: 'Marthe NGOUANFO' },
      { key: 'positionTitle', label: 'Fonction occupée', type: 'text', defaultValue: 'Comptable Trésorerie' },
      { key: 'startDate', label: "Date d'entrée", type: 'date', defaultValue: '2023-01-15' },
      { key: 'endDate', label: 'Date de sortie définitive', type: 'date', defaultValue: new Date().toISOString().split('T')[0] }
    ],
    bodyTemplate: `CERTIFICAT DE TRAVAIL RÉGLEMENTAIRE

Nous soussignés, CITRINE SARL, certifions que :

M./Mme {{employeeName}} a été employé(e) au sein de notre société du {{startDate}} au {{endDate}}.

Durant cette période, l'intéressé(e) a occupé successivement et avec compétence le poste de :
{{positionTitle}}.

M./Mme {{employeeName}} quitte notre société libre de tout engagement envers elle.

En foi de quoi, le présent certificat de travail lui est délivré pour servir et valoir ce que de droit conformément au Code du Travail.`
  },
  {
    id: 'tpl-amendment',
    name: "Avenant au Contrat de Travail",
    category: 'amendment',
    formatType: 'word',
    description: "Modification officielle de clauses contractuelles (salaire, promotion, temps de travail).",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Alain TCHAKOUNTE' },
      { key: 'newPosition', label: 'Nouvelle Fonction / Promotion', type: 'text', defaultValue: 'Superviseur Général des Chantiers' },
      { key: 'newSalary', label: 'Nouveau Salaire Brut (FCFA)', type: 'number', defaultValue: '550000' },
      { key: 'effectiveDate', label: "Date d'effet de l'avenant", type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'reason', label: 'Motif de la modification', type: 'text', defaultValue: 'Reconnaissance des performances et élargissement des responsabilités' }
    ],
    bodyTemplate: `AVENANT N° 01 AU CONTRAT DE TRAVAIL

ENTRE :
La société CITRINE SARL,
D'une part,

ET :
M./Mme {{employeeName}},
D'autre part,

IL A ÉTÉ CONVENU LA MODIFICATION SUIVANTE :

ARTICLE 1 - NOUVELLES ATTRIBUTIONS
À compter du {{effectiveDate}}, le Salarié est promu aux fonctions de : {{newPosition}}.

ARTICLE 2 - REVALORISATION DE LA RÉMUNÉRATION
En contrepartie de ses responsabilités élargies, le salaire mensuel brut du Salarié est fixé à {{newSalary}} FCFA.

ARTICLE 3 - MAINTIEN DES AUTRES CLAUSES
Toutes les autres clauses du contrat de travail initial non expressément modifiées par le présent avenant demeurent inchangées et pleinement applicables.`
  },
  {
    id: 'tpl-internship',
    name: "Attestation de Fin de Stage",
    category: 'internship',
    formatType: 'word',
    description: "Attestation de validation d'un stage académique ou professionnel.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Stagiaire', type: 'text', defaultValue: 'Sandrine FOTSO' },
      { key: 'institution', label: 'Établissement / Université', type: 'text', defaultValue: 'Institut Universitaire de la Côte (IUC)' },
      { key: 'department', label: "Service d'accueil", type: 'text', defaultValue: 'Ressources Humaines & Gestion du Personnel' },
      { key: 'startDate', label: 'Date de début', type: 'date', defaultValue: '2024-03-01' },
      { key: 'endDate', label: 'Date de fin', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'evaluationSummary', label: 'Appréciation générale', type: 'textarea', defaultValue: "Le stagiaire a fait preuve d'assiduité, de rigueur et d'une excellente capacité d'intégration dans nos équipes." }
    ],
    bodyTemplate: `ATTESTATION DE FIN DE STAGE PROFESSIONNEL

La Direction Générale de CITRINE SARL certifie par la présente que :

M./Mme {{employeeName}}, étudiant(e) à {{institution}}, a effectué un stage professionnel au sein de notre établissement, département {{department}}, du {{startDate}} au {{endDate}}.

BILAN ET APPRÉCIATION :
{{evaluationSummary}}

La présente attestation est délivrée pour servir de validation académique et professionnelle.`
  },
  {
    id: 'tpl-mission',
    name: "Ordre de Mission & Déplacement Professionnel",
    category: 'mission',
    formatType: 'word',
    description: "Autorisation officielle et cadrage d'un déplacement de travail extérieur.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Collaborateur missionné', type: 'text', defaultValue: 'Éric MBIDA' },
      { key: 'positionTitle', label: 'Poste', type: 'text', defaultValue: 'Ingénieur Contrôle Qualité' },
      { key: 'destination', label: 'Lieu de destination', type: 'text', defaultValue: 'Kribi - Port Autonome & Zone Industrielle' },
      { key: 'departureDate', label: 'Date de départ', type: 'date', defaultValue: new Date().toISOString().split('T')[0] },
      { key: 'returnDate', label: 'Date de retour prévue', type: 'date', defaultValue: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0] },
      { key: 'missionPurpose', label: 'Objet de la mission', type: 'textarea', defaultValue: "Audit technique sur site, inspection des équipements et réunion d'avancement avec le partenaire." },
      { key: 'transportMode', label: 'Moyen de transport', type: 'text', defaultValue: "Véhicule de service d'entreprise" }
    ],
    bodyTemplate: `ORDRE DE MISSION PROFESSIONNEL

Il est ordonné à :
M./Mme {{employeeName}}, exerçant les fonctions de {{positionTitle}},

De se rendre en mission officielle à : {{destination}}

PÉRIODE DE LA MISSION :
- Départ : {{departureDate}}
- Retour prévu : {{returnDate}}
- Mode de transport : {{transportMode}}

OBJET ET PROGRAMME DE TRAVAIL :
{{missionPurpose}}

Les autorités civiles et militaires ainsi que les représentants locaux sont priés de faciliter le bon accomplissement de cette mission.`
  },
  {
    id: 'tpl-discharge',
    name: "Décharge de Matériel & Restitution d'Équipement",
    category: 'discharge',
    formatType: 'word',
    description: "Attestation de mise à disposition ou de restitution de matériel de l'entreprise.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Bénéficiaire', type: 'text', defaultValue: 'Gilles BIKOI' },
      { key: 'movementType', label: 'Type de mouvement', type: 'select', defaultValue: 'Attribution / Mise à disposition', options: ['Attribution / Mise à disposition', 'Restitution définitive / Fin de poste', 'Échange pour maintenance'] },
      { key: 'equipmentList', label: 'Détail des matériels & N° de série', type: 'textarea', defaultValue: "- PC Portable Dell Latitude 5420 (S/N: DL-984210)\n- Chargeur secteur officiel + Sacoche renforcée\n- Badge sécurisé d'accès aux locaux N° B-104\n- Clé 4G professionnelle Orange" },
      { key: 'terms', label: 'Engagement de garde', type: 'textarea', defaultValue: "Le collaborateur s'engage à utiliser ces matériels exclusivement à des fins professionnelles et à les conserver en parfait état d'entretien." }
    ],
    bodyTemplate: `BORDEREAU DE DÉCHARGE ET MISE À DISPOSITION DE MATÉRIEL

TYPE D'OPÉRATION : {{movementType}}

BÉNÉFICIAIRE :
M./Mme {{employeeName}}

INVENTAIRE DES ÉQUIPEMENTS :
{{equipmentList}}

ENGAGEMENTS :
{{terms}}

En cas de perte, vol par négligence ou détérioration anormale, le collaborateur devra en informer sans délai la Direction.`
  },
  {
    id: 'tpl-convocation',
    name: "Convocation à Entretien Préalable",
    category: 'disciplinary',
    formatType: 'word',
    description: "Lettre formelle de convocation avant toute prise de décision disciplinaire.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Collaborateur', type: 'text', defaultValue: 'Marc NANA' },
      { key: 'positionTitle', label: 'Poste', type: 'text', defaultValue: 'Agent Commercial' },
      { key: 'meetingDate', label: "Date de l'entretien", type: 'date', defaultValue: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0] },
      { key: 'meetingTime', label: 'Heure', type: 'text', defaultValue: '10h30' },
      { key: 'meetingLocation', label: 'Lieu de convocation', type: 'text', defaultValue: 'Bureau de la Direction RH, Siège Japoma' },
      { key: 'reason', label: 'Motifs reprochés', type: 'textarea', defaultValue: 'Absences injustifiées et manquements constatés aux consignes de sécurité le 12/03/2026.' }
    ],
    bodyTemplate: `LETTRE DE CONVOCATION À UN ENTRETIEN PRÉALABLE

À l'attention de M./Mme {{employeeName}}, {{positionTitle}}

Monsieur / Madame,

Nous vous informons par la présente que nous sommes amenés à envisager à votre encontre une mesure disciplinaire suite aux faits suivants :
{{reason}}

Conformément à la réglementation du travail, nous vous prions de vous présenter à un entretien préalable qui se tiendra :
- Le : {{meetingDate}}
- À : {{meetingTime}}
- Lieu : {{meetingLocation}}

Lors de cet entretien, vous pourrez exposer vos explications sur les faits qui vous sont reprochés et vous faire assister par un délégué du personnel de votre choix.`
  },
  {
    id: 'tpl-warning',
    name: "Notification de Sanction (Avertissement Écrit)",
    category: 'disciplinary',
    formatType: 'word',
    description: "Notification officielle d'une sanction inscrite au dossier du salarié.",
    defaultSignature: false,
    fields: [
      { key: 'employeeName', label: 'Nom du Salarié', type: 'text', defaultValue: 'Marc NANA' },
      { key: 'positionTitle', label: 'Fonction', type: 'text', defaultValue: 'Agent Commercial' },
      { key: 'incidentSummary', label: 'Rappel des faits fautifs', type: 'textarea', defaultValue: 'Retards répétés non justifiés et non-respect du port des équipements de protection individuelle (EPI) sur site.' },
      { key: 'decision', label: 'Décision retenue', type: 'text', defaultValue: 'Avertissement formel avec inscription au dossier individuel' },
      { key: 'injonction', label: 'Consigne impérative', type: 'textarea', defaultValue: 'Nous vous enjoignons de vous conformer immédiatement aux règles établies. Toute récidive conduira à des mesures disciplinaires plus sévères.' }
    ],
    bodyTemplate: `NOTIFICATION OFFICIELLE DE SANCTION DISCIPLINAIRE

À M./Mme {{employeeName}}, {{positionTitle}}

Monsieur / Madame,

À la suite de l'examen de votre situation et des explications recueillies, nous vous notifions par la présente la décision suivante :

NATURE DE LA SANCTION : {{decision}}

RAPPEL DES FAITS REPROCHÉS :
{{incidentSummary}}

INJONCTION DE LA DIRECTION :
{{injonction}}

Le présent document est versé à votre dossier administratif.`
  },
  {
    id: 'tpl-job-description',
    name: "Fiche de Poste & Définition des Missions",
    category: 'job_description',
    formatType: 'word',
    description: "Descriptif type des responsabilités, compétences et indicateurs de performance d'un poste.",
    defaultSignature: false,
    fields: [
      { key: 'jobTitle', label: 'Intitulé du Poste', type: 'text', defaultValue: "Chef d'Équipe Logistique & Parc" },
      { key: 'department', label: 'Département', type: 'text', defaultValue: 'Opérations & Maintenance' },
      { key: 'hierarchicalSupervisor', label: 'Supérieur Hiérarchique', type: 'text', defaultValue: "Directeur d'Exploitation" },
      { key: 'primaryMissions', label: 'Missions Principales', type: 'textarea', defaultValue: "1. Planifier les rotations de véhicules et le pointage des chauffeurs.\n2. Contrôler les carnets de bord et la consommation de carburant.\n3. Veiller à la disponibilité opérationnelle du matériel 24/7." },
      { key: 'requiredSkills', label: 'Compétences Requises', type: 'textarea', defaultValue: 'Rigueur organisationnelle, maîtrise de la gestion de flotte, sens du leadership et gestion du stress.' }
    ],
    bodyTemplate: `FICHE DE POSTE ET RÉFÉRENTIEL DE MISSIONS

INTITULÉ DU POSTE : {{jobTitle}}
DÉPARTEMENT       : {{department}}
RATTACHEMENT      : {{hierarchicalSupervisor}}

1. FINALITÉ DU POSTE
Le titulaire du poste garantit la fluidité, la sécurité et la conformité des processus qui lui sont confiés.

2. MISSIONS PRINCIPALES ET ACTIVITÉS CLÉS
{{primaryMissions}}

3. COMPÉTENCES ET PRÉREQUIS TECHNIQUES
{{requiredSkills}}

Document type émis par la Direction des Ressources Humaines.`
  },
  {
    id: 'tpl-regulation',
    name: "Règlement Intérieur & Charte de Conduite",
    category: 'regulation',
    formatType: 'word',
    description: "Modèle de charte collective fixant les règles de sécurité, d'éthique et de discipline générale.",
    defaultSignature: false,
    fields: [
      { key: 'scope', label: "Périmètre d'application", type: 'text', defaultValue: 'Ensemble des sites, ateliers et bureaux de CITRINE SARL' },
      { key: 'workHours', label: 'Horaires collectifs', type: 'text', defaultValue: 'Du lundi au vendredi : 08h00 - 12h30 et 13h30 - 17h00' },
      { key: 'safetyRules', label: 'Règles de sécurité clés', type: 'textarea', defaultValue: 'Le port des EPI (casque, gilet, chaussures de sécurité) est strictement obligatoire sur toutes les zones techniques.' },
      { key: 'ethicsSummary', label: 'Dispositions éthiques', type: 'textarea', defaultValue: 'Intolérance totale envers le harcèlement, la discrimination et toute forme de corruption.' }
    ],
    bodyTemplate: `RÈGLEMENT INTÉRIEUR ET CHARTE DE BONNE CONDUITE

PÉRIMÈTRE D'APPLICATION : {{scope}}

ARTICLE 1 - HORAIRES DE TRAVAIL ET PONCTUALITÉ
{{workHours}}
Tout retard ou absence doit être impérativement signalé au supérieur hiérarchique dès le début de journée.

ARTICLE 2 - HYGIÈNE ET SÉCURITÉ AU TRAVAIL
{{safetyRules}}

ARTICLE 3 - ÉTHIQUE ET PROBITÉ
{{ethicsSummary}}

Le présent règlement est porté à la connaissance de tout le personnel par affichage et remise lors de l'intégration.`
  },
  {
    id: 'tpl-evaluation',
    name: "Grille d'Évaluation & Entretien Annuel",
    category: 'evaluation',
    formatType: 'word',
    description: "Trame d'entretien professionnel périodique, évaluation des objectifs et besoins en formation.",
    defaultSignature: false,
    fields: [
      { key: 'campaignYear', label: 'Année de la Campagne', type: 'text', defaultValue: `${new Date().getFullYear()}` },
      { key: 'evaluationCriteria', label: "Critères d'évaluation", type: 'textarea', defaultValue: "1. Atteinte des objectifs quantitatifs et qualitatifs fixés\n2. Rigueur professionnelle et respect des délais\n3. Esprit d'équipe et communication avec les pairs\n4. Autonomie et force de proposition" },
      { key: 'developmentPlans', label: "Axes d'amélioration & Formations envisagées", type: 'textarea', defaultValue: 'Formation aux nouveaux outils de gestion de projet et perfectionnement en sécurité industrielle.' }
    ],
    bodyTemplate: `GRILLE DE SYNTHÈSE - ENTRETIEN ANNUEL D'ÉVALUATION

CAMPAGNE D'ÉVALUATION : Année {{campaignYear}}

1. GRILLE DE NOTATION DES COMPÉTENCES
{{evaluationCriteria}}

2. PLAN DE DÉVELOPPEMENT ET SOUHAITS D'ÉVOLUTION
{{developmentPlans}}

3. CONCLUSION GÉNÉRALE
Document support d'entretien professionnel à renseigner lors de l'échange bilatéral.`
  }
];

/**
 * Génère le contenu textuel d'un modèle RH en substituant ses variables {{cle}}
 */
export function renderRHTemplateText(template: RHDocTemplate, params: Record<string, any>): string {
  let text = template.bodyTemplate || '';
  
  // Remplacement de tous les tags {{key}}
  Object.keys(params).forEach((key) => {
    const val = params[key];
    const formattedVal = typeof val === 'number' 
      ? val.toLocaleString('fr-FR')
      : (val !== undefined && val !== null ? String(val) : '');
    text = text.split(`{{${key}}}`).join(formattedVal);
  });

  // Nettoyage des éventuels tags restants
  template.fields.forEach((f) => {
    if (text.includes(`{{${f.key}}}`)) {
      text = text.split(`{{${f.key}}}`).join(f.defaultValue || '');
    }
  });

  return text;
}

/**
 * Souscription en temps réel aux modèles de documents RH enregistrés en base de données Firestore.
 * Si la base Firestore est vierge pour cette collection, procède à l'amorçage automatique des modèles initiaux.
 */
export function subscribeToRHDocumentTemplates(
  onUpdate: (templates: RHDocTemplate[]) => void
): () => void {
  let isInitialized = false;

  const unsubscribe = subscribeToCollection<RHDocTemplate>(
    COLLECTIONS.RH_DOCUMENT_TEMPLATES,
    async (dbTemplates) => {
      if (!isInitialized && dbTemplates.length === 0) {
        isInitialized = true;
        // La collection est vide en BD Firestore : amorçage automatique
        try {
          for (const tpl of DEFAULT_RH_TEMPLATES) {
            await saveDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, {
              ...tpl,
              updatedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('Initialisation des modèles RH en BD différée:', err);
        }
        // Retourne les modèles par défaut en attendant l'écriture
        onUpdate(DEFAULT_RH_TEMPLATES);
        return;
      }

      isInitialized = true;
      if (dbTemplates.length > 0) {
        onUpdate(dbTemplates);
      } else {
        onUpdate(DEFAULT_RH_TEMPLATES);
      }
    }
  );

  return unsubscribe;
}

/**
 * Enregistre ou met à jour un modèle de document RH en base de données Firestore
 */
export async function saveRHDocumentTemplate(template: RHDocTemplate): Promise<void> {
  const dataToSave: RHDocTemplate = {
    ...template,
    updatedAt: new Date().toISOString()
  };
  await saveDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, dataToSave);
}

/**
 * Supprime un modèle de document RH en base de données Firestore
 */
export async function deleteRHDocumentTemplate(templateId: string): Promise<void> {
  await deleteDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, templateId);
}

/**
 * Restaure l'ensemble des modèles d'entreprise par défaut en base de données Firestore
 */
export async function resetRHDocumentTemplatesToDefaults(): Promise<void> {
  for (const tpl of DEFAULT_RH_TEMPLATES) {
    await saveDocument(COLLECTIONS.RH_DOCUMENT_TEMPLATES, {
      ...tpl,
      updatedAt: new Date().toISOString()
    });
  }
}
